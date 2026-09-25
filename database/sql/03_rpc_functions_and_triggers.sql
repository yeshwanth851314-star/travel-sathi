-- ============================================================================
-- Travel Sathi — 03_rpc_functions_and_triggers.sql
-- Backend RPC Functions (SECURITY DEFINER) and Automated Database Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity text, _entity_id text, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), _action, _entity, _entity_id, _details);
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) FROM anon, authenticated, public;

-- New user handler: first registered user -> admin, subsequent users -> tourist
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.tourist_profiles(user_id, nationality) VALUES (NEW.id, NEW.raw_user_meta_data->>'nationality');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'tourist');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin role management RPC
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can change roles'; END IF;
  IF _user_id = auth.uid() AND _role <> 'admin' THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
  PERFORM public.log_audit('role_changed','user',_user_id::text, jsonb_build_object('role',_role));
END $$;

-- Emergency contact single-primary enforcement
CREATE TRIGGER ec_updated BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.ensure_single_primary() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.emergency_contacts SET is_primary=false WHERE user_id=NEW.user_id AND id<>NEW.id AND is_primary;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ec_primary AFTER INSERT OR UPDATE OF is_primary ON public.emergency_contacts FOR EACH ROW WHEN (NEW.is_primary) EXECUTE FUNCTION public.ensure_single_primary();

CREATE TRIGGER inc_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_staff(_type text, _title text, _msg text, _prio public.incident_severity, _incident uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.notifications(user_id,type,title,message,priority,incident_id)
  SELECT DISTINCT user_id, _type, _title, _msg, _prio, _incident FROM public.user_roles WHERE role IN ('responder','admin');
$$;
REVOKE EXECUTE ON FUNCTION public.notify_staff(text,text,text,public.incident_severity,uuid) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.kind_label(k public.incident_kind) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE k WHEN 'sos' THEN 'SOS' WHEN 'incident' THEN 'Incident report' ELSE 'Assistance request' END $$;

-- After insert on incidents: timeline + notifications
CREATE OR REPLACE FUNCTION public.on_incident_created() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n_contacts int;
BEGIN
  INSERT INTO public.incident_timeline(incident_id, actor_id, event, status)
  VALUES (NEW.id, NEW.reporter_id, CASE WHEN NEW.kind='sos' THEN 'SOS activated' ELSE public.kind_label(NEW.kind) || ' submitted' END, NEW.status);
  IF NEW.latitude IS NOT NULL THEN
    INSERT INTO public.incident_locations(incident_id,user_id,latitude,longitude,accuracy,location_text)
    VALUES (NEW.id, NEW.reporter_id, NEW.latitude, NEW.longitude, NEW.accuracy, NEW.location_text);
    INSERT INTO public.incident_timeline(incident_id, actor_id, event, details)
    VALUES (NEW.id, NEW.reporter_id, 'Location received', 'Accuracy ±' || COALESCE(round(NEW.accuracy)::text,'?') || ' m');
  ELSIF NEW.location_text IS NOT NULL AND NEW.location_text <> '' THEN
    INSERT INTO public.incident_timeline(incident_id, actor_id, event, details)
    VALUES (NEW.id, NEW.reporter_id, 'Manual location provided', NEW.location_text);
  ELSE
    INSERT INTO public.incident_timeline(incident_id, actor_id, event, details)
    VALUES (NEW.id, NEW.reporter_id, 'No location available', 'Location access was not available when this was created.');
  END IF;
  IF NEW.kind='sos' THEN
    SELECT count(*) INTO n_contacts FROM public.emergency_contacts WHERE user_id=NEW.reporter_id AND is_active;
    INSERT INTO public.incident_timeline(incident_id, actor_id, event, details)
    VALUES (NEW.id, NULL, 'Emergency contacts not notified automatically',
      'External SMS/email provider not configured. ' || n_contacts || ' active contact(s) on file were NOT messaged. Please contact them directly.');
  END IF;
  INSERT INTO public.notifications(user_id,type,title,message,priority,incident_id)
  VALUES (NEW.reporter_id, CASE WHEN NEW.kind='sos' THEN 'sos_activated' ELSE 'incident_received' END,
    CASE WHEN NEW.kind='sos' THEN 'SOS activated' ELSE public.kind_label(NEW.kind) || ' submitted' END,
    NEW.ref || ' has been recorded and sent to responders.', NEW.severity, NEW.id);
  PERFORM public.notify_staff(CASE WHEN NEW.kind='sos' THEN 'sos_activated' ELSE 'incident_received' END,
    CASE WHEN NEW.kind='sos' THEN 'NEW SOS — ' ELSE 'New ' || lower(public.kind_label(NEW.kind)) || ' — ' END || upper(NEW.severity::text),
    NEW.ref || ': ' || NEW.category, NEW.severity, NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER incident_created AFTER INSERT ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.on_incident_created();

-- Location insert: update incident current location + timeline
CREATE OR REPLACE FUNCTION public.on_location_added() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.incidents WHERE id=NEW.incident_id AND latitude IS NOT DISTINCT FROM NEW.latitude AND longitude IS NOT DISTINCT FROM NEW.longitude AND location_updated_at IS NULL AND created_at > now() - interval '2 seconds') THEN
    UPDATE public.incidents SET location_updated_at=NEW.created_at WHERE id=NEW.incident_id;
    RETURN NEW;
  END IF;
  UPDATE public.incidents SET latitude=COALESCE(NEW.latitude,latitude), longitude=COALESCE(NEW.longitude,longitude),
    accuracy=COALESCE(NEW.accuracy,accuracy), location_text=COALESCE(NEW.location_text,location_text),
    location_updated_at=NEW.created_at, location_sharing = (NEW.latitude IS NOT NULL) OR location_sharing
  WHERE id=NEW.incident_id;
  INSERT INTO public.incident_timeline(incident_id, actor_id, event, details)
  VALUES (NEW.incident_id, NEW.user_id, 'Location updated',
    CASE WHEN NEW.latitude IS NOT NULL THEN 'Accuracy ±' || COALESCE(round(NEW.accuracy)::text,'?') || ' m' ELSE NEW.location_text END);
  RETURN NEW;
END $$;
CREATE TRIGGER location_added AFTER INSERT ON public.incident_locations FOR EACH ROW EXECUTE FUNCTION public.on_location_added();

-- Notes timeline
CREATE OR REPLACE FUNCTION public.on_note_added() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.incident_timeline(incident_id, actor_id, event) VALUES (NEW.incident_id, NEW.author_id, 'Response note added');
  RETURN NEW;
END $$;
CREATE TRIGGER note_added AFTER INSERT ON public.incident_notes FOR EACH ROW EXECUTE FUNCTION public.on_note_added();

-- SOS trigger RPC (idempotent deduplication with advisory lock)
CREATE OR REPLACE FUNCTION public.trigger_sos(_lat double precision, _lng double precision, _accuracy double precision, _location_text text, _description text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); existing public.incidents; created public.incidents;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('sos:' || uid::text));
  SELECT * INTO existing FROM public.incidents WHERE reporter_id=uid AND kind='sos' AND status NOT IN ('resolved','cancelled') LIMIT 1;
  IF FOUND THEN RETURN json_build_object('id', existing.id, 'existing', true); END IF;
  INSERT INTO public.incidents(reporter_id, kind, category, severity, status, description, latitude, longitude, accuracy, location_text, location_sharing)
  VALUES (uid, 'sos', 'SOS Emergency', 'critical', 'submitted', NULLIF(left(_description,4000),''), _lat, _lng, _accuracy, NULLIF(left(_location_text,500),''), _lat IS NOT NULL)
  RETURNING * INTO created;
  RETURN json_build_object('id', created.id, 'existing', false);
END $$;

-- Status transitions RPC
CREATE OR REPLACE FUNCTION public.update_incident_status(_incident_id uuid, _status public.incident_status, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inc public.incidents; uid uuid := auth.uid(); staff boolean; allowed public.incident_status[]; label text; ntype text;
BEGIN
  SELECT * INTO inc FROM public.incidents WHERE id=_incident_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Incident not found'; END IF;
  staff := public.is_staff(uid);
  IF NOT staff THEN
    IF inc.reporter_id <> uid THEN RAISE EXCEPTION 'Not allowed'; END IF;
    IF _status <> 'cancelled' OR inc.status NOT IN ('submitted','received','assigned') THEN
      RAISE EXCEPTION 'You can only cancel a request before a responder has accepted it';
    END IF;
  ELSE
    allowed := CASE inc.status
      WHEN 'submitted' THEN ARRAY['received','accepted','cancelled']::public.incident_status[]
      WHEN 'received' THEN ARRAY['accepted','cancelled']::public.incident_status[]
      WHEN 'assigned' THEN ARRAY['accepted','cancelled']::public.incident_status[]
      WHEN 'accepted' THEN ARRAY['en_route','assistance_provided','resolved']::public.incident_status[]
      WHEN 'en_route' THEN ARRAY['assistance_provided','resolved']::public.incident_status[]
      WHEN 'assistance_provided' THEN ARRAY['resolved']::public.incident_status[]
      ELSE ARRAY[]::public.incident_status[] END;
    IF NOT (_status = ANY(allowed)) THEN
      RAISE EXCEPTION 'Cannot move from % to %', inc.status, _status;
    END IF;
    IF inc.status='assigned' AND _status='accepted' AND inc.assigned_responder_id <> uid AND NOT public.has_role(uid,'admin') THEN
      RAISE EXCEPTION 'This incident is assigned to another responder';
    END IF;
  END IF;

  IF _status='accepted' AND (inc.assigned_responder_id IS NULL OR inc.assigned_responder_id <> uid) AND public.has_role(uid,'responder') THEN
    UPDATE public.incidents SET assigned_responder_id=uid WHERE id=_incident_id;
    INSERT INTO public.incident_assignments(incident_id,responder_id,assigned_by) VALUES (_incident_id, uid, uid);
  END IF;

  UPDATE public.incidents SET status=_status,
    resolution = CASE WHEN _status IN ('resolved','cancelled') THEN COALESCE(NULLIF(left(_note,2000),''), resolution) ELSE resolution END,
    resolved_at = CASE WHEN _status IN ('resolved','cancelled') THEN now() ELSE resolved_at END,
    location_sharing = CASE WHEN _status IN ('resolved','cancelled') THEN false ELSE location_sharing END
  WHERE id=_incident_id;

  label := CASE _status WHEN 'received' THEN 'Incident received by responders' WHEN 'accepted' THEN 'Responder accepted'
    WHEN 'en_route' THEN 'Responder en route' WHEN 'assistance_provided' THEN 'Assistance provided'
    WHEN 'resolved' THEN 'Resolved' WHEN 'cancelled' THEN 'Cancelled' ELSE 'Status changed' END;
  ntype := CASE _status WHEN 'accepted' THEN 'responder_accepted' WHEN 'resolved' THEN 'incident_resolved' WHEN 'received' THEN 'incident_received' ELSE 'status_changed' END;
  INSERT INTO public.incident_timeline(incident_id, actor_id, event, status, details) VALUES (_incident_id, uid, label, _status, NULLIF(_note,''));
  IF inc.reporter_id <> uid THEN
    INSERT INTO public.notifications(user_id,type,title,message,priority,incident_id)
    VALUES (inc.reporter_id, ntype, label, inc.ref || ' is now: ' || label || COALESCE(' — ' || NULLIF(_note,''), ''), inc.severity, _incident_id);
  END IF;
  IF _status='cancelled' AND inc.reporter_id = uid THEN
    PERFORM public.notify_staff('status_changed', 'Cancelled by tourist', inc.ref || ' was cancelled by the tourist', inc.severity, _incident_id);
  END IF;
  PERFORM public.log_audit('status_changed','incident',_incident_id::text, jsonb_build_object('from',inc.status,'to',_status));
END $$;

-- Assign responder RPC
CREATE OR REPLACE FUNCTION public.assign_incident(_incident_id uuid, _responder_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inc public.incidents; uid uuid := auth.uid(); rname text;
BEGIN
  IF NOT public.is_staff(uid) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF NOT public.has_role(_responder_id,'responder') THEN RAISE EXCEPTION 'Selected user is not a responder'; END IF;
  SELECT * INTO inc FROM public.incidents WHERE id=_incident_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Incident not found'; END IF;
  IF inc.status IN ('resolved','cancelled') THEN RAISE EXCEPTION 'Incident is closed'; END IF;
  SELECT COALESCE(NULLIF(full_name,''), email) INTO rname FROM public.profiles WHERE id=_responder_id;
  UPDATE public.incidents SET assigned_responder_id=_responder_id,
    status = CASE WHEN status IN ('submitted','received') THEN 'assigned'::public.incident_status ELSE status END
  WHERE id=_incident_id;
  INSERT INTO public.incident_assignments(incident_id,responder_id,assigned_by) VALUES (_incident_id,_responder_id,uid);
  INSERT INTO public.incident_timeline(incident_id, actor_id, event, status, details)
  VALUES (_incident_id, uid, 'Responder assigned', CASE WHEN inc.status IN ('submitted','received') THEN 'assigned'::public.incident_status END, rname);
  INSERT INTO public.notifications(user_id,type,title,message,priority,incident_id)
  VALUES (inc.reporter_id,'responder_assigned','Responder assigned', inc.ref || ' has been assigned to a responder.', inc.severity, _incident_id);
  IF _responder_id <> uid THEN
    INSERT INTO public.notifications(user_id,type,title,message,priority,incident_id)
    VALUES (_responder_id,'responder_assigned','Incident assigned to you', inc.ref || ': ' || inc.category || ' (' || upper(inc.severity::text) || ')', inc.severity, _incident_id);
  END IF;
  PERFORM public.log_audit('assigned','incident',_incident_id::text, jsonb_build_object('responder',_responder_id));
END $$;

-- Safety Info, Resources, and Alerts Audit & Notification Triggers
CREATE TRIGGER si_updated BEFORE UPDATE ON public.safety_information FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.on_info_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.is_verified AND NEW.is_published AND (TG_OP='INSERT' OR NOT (OLD.is_verified AND OLD.is_published)) THEN
    INSERT INTO public.notifications(user_id,type,title,message,priority)
    SELECT user_id,'info_update','Verified safety information', NEW.title, 'low' FROM public.user_roles WHERE role='tourist';
  END IF;
  PERFORM public.log_audit(lower(TG_OP),'safety_information',NEW.id::text, jsonb_build_object('title',NEW.title));
  RETURN NEW;
END $$;
CREATE TRIGGER info_change AFTER INSERT OR UPDATE ON public.safety_information FOR EACH ROW EXECUTE FUNCTION public.on_info_change();

CREATE TRIGGER er_updated BEFORE UPDATE ON public.emergency_resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.on_resource_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.log_audit(lower(TG_OP),'emergency_resource',COALESCE(NEW.id,OLD.id)::text, jsonb_build_object('name',COALESCE(NEW.name,OLD.name)));
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER resource_change AFTER INSERT OR UPDATE OR DELETE ON public.emergency_resources FOR EACH ROW EXECUTE FUNCTION public.on_resource_change();

CREATE TRIGGER sa_updated BEFORE UPDATE ON public.safety_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.on_alert_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.is_active AND (TG_OP='INSERT' OR NOT OLD.is_active) THEN
    INSERT INTO public.notifications(user_id,type,title,message,priority)
    SELECT DISTINCT user_id,'safety_alert','Safety alert: ' || NEW.title, NEW.message, NEW.severity FROM public.user_roles;
  END IF;
  PERFORM public.log_audit(lower(TG_OP),'safety_alert',NEW.id::text, jsonb_build_object('title',NEW.title));
  RETURN NEW;
END $$;
CREATE TRIGGER alert_change AFTER INSERT OR UPDATE ON public.safety_alerts FOR EACH ROW EXECUTE FUNCTION public.on_alert_change();
