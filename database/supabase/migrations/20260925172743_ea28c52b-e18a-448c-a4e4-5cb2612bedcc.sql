
CREATE TYPE public.app_role AS ENUM ('tourist','responder','admin');
CREATE TYPE public.incident_kind AS ENUM ('sos','incident','assistance');
CREATE TYPE public.incident_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.incident_status AS ENUM ('submitted','received','assigned','accepted','en_route','assistance_provided','resolved','cancelled');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tourist_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  nationality text,
  home_country text,
  languages text,
  medical_notes text,
  travel_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tourist_profiles TO authenticated;
GRANT ALL ON public.tourist_profiles TO service_role;
ALTER TABLE public.tourist_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('responder','admin'))
$$;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated, service_role;

CREATE POLICY "own or staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "own or staff read tourist" ON public.tourist_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own tourist insert" ON public.tourist_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tourist update" ON public.tourist_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own or admin read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- AUDIT
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity text, _entity_id text, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details) VALUES (auth.uid(), _action, _entity, _entity_id, _details);
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) FROM anon, authenticated, public;

-- New user handler: first user -> admin, others tourist
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

-- Admin role management
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only admins can change roles'; END IF;
  IF _user_id = auth.uid() AND _role <> 'admin' THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
  PERFORM public.log_audit('role_changed','user',_user_id::text, jsonb_build_object('role',_role));
END $$;

-- EMERGENCY CONTACTS
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  priority int NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "staff read contacts" ON public.emergency_contacts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER ec_updated BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.ensure_single_primary() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.emergency_contacts SET is_primary=false WHERE user_id=NEW.user_id AND id<>NEW.id AND is_primary;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ec_primary AFTER INSERT OR UPDATE OF is_primary ON public.emergency_contacts FOR EACH ROW WHEN (NEW.is_primary) EXECUTE FUNCTION public.ensure_single_primary();

-- INCIDENTS
CREATE SEQUENCE public.incident_ref_seq START 1001;
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE DEFAULT ('INC-' || nextval('public.incident_ref_seq')),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.incident_kind NOT NULL,
  category text NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  status public.incident_status NOT NULL DEFAULT 'submitted',
  description text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  location_text text,
  location_updated_at timestamptz,
  location_sharing boolean NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  contact_info text,
  evidence_path text,
  assigned_responder_id uuid REFERENCES public.profiles(id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT desc_len CHECK (description IS NULL OR char_length(description) <= 4000)
);
CREATE UNIQUE INDEX one_active_sos_per_user ON public.incidents(reporter_id) WHERE kind='sos' AND status NOT IN ('resolved','cancelled');
CREATE INDEX incidents_status_idx ON public.incidents(status);
GRANT SELECT, INSERT ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read incidents" ON public.incidents FOR SELECT TO authenticated
  USING (reporter_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "tourist creates own reports" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (reporter_id=auth.uid() AND status='submitted' AND kind IN ('incident','assistance') AND assigned_responder_id IS NULL);
CREATE TRIGGER inc_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.incident_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES public.profiles(id),
  assigned_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.incident_assignments TO authenticated;
GRANT ALL ON public.incident_assignments TO service_role;
ALTER TABLE public.incident_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read assignments" ON public.incident_assignments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid()));

CREATE TABLE public.incident_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  location_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.incident_locations TO authenticated;
GRANT ALL ON public.incident_locations TO service_role;
ALTER TABLE public.incident_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read locations" ON public.incident_locations FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid()));
CREATE POLICY "reporter adds location to active incident" ON public.incident_locations FOR INSERT TO authenticated WITH CHECK (
  user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid() AND i.status NOT IN ('resolved','cancelled')));

CREATE TABLE public.incident_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.incident_notes TO authenticated;
GRANT ALL ON public.incident_notes TO service_role;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes" ON public.incident_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff add notes" ON public.incident_notes FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid() AND public.is_staff(auth.uid()));

CREATE TABLE public.incident_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL,
  status public.incident_status,
  details text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
GRANT SELECT ON public.incident_timeline TO authenticated;
GRANT ALL ON public.incident_timeline TO service_role;
ALTER TABLE public.incident_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read timeline" ON public.incident_timeline FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority public.incident_severity NOT NULL DEFAULT 'medium',
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

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
  -- skip rows created by incident creation trigger (same timestamp as incident)
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

-- SOS trigger (dedupe)
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

-- Status transitions
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

-- Assign
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

-- SAFETY INFORMATION
CREATE TABLE public.safety_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  source text,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  review_date date,
  is_published boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.safety_information TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_information TO authenticated;
GRANT ALL ON public.safety_information TO service_role;
ALTER TABLE public.safety_information ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published info" ON public.safety_information FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage info" ON public.safety_information FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
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

-- EMERGENCY RESOURCES
CREATE TABLE public.emergency_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  phone text,
  address text,
  operating_hours text,
  latitude double precision,
  longitude double precision,
  is_verified boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.emergency_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_resources TO authenticated;
GRANT ALL ON public.emergency_resources TO service_role;
ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read resources" ON public.emergency_resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage resources" ON public.emergency_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER er_updated BEFORE UPDATE ON public.emergency_resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.on_resource_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.log_audit(lower(TG_OP),'emergency_resource',COALESCE(NEW.id,OLD.id)::text, jsonb_build_object('name',COALESCE(NEW.name,OLD.name)));
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER resource_change AFTER INSERT OR UPDATE OR DELETE ON public.emergency_resources FOR EACH ROW EXECUTE FUNCTION public.on_resource_change();

-- SAFETY ALERTS
CREATE TABLE public.safety_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  area text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.safety_alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_alerts TO authenticated;
GRANT ALL ON public.safety_alerts TO service_role;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active alerts" ON public.safety_alerts FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage alerts" ON public.safety_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
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

-- STORAGE for evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users upload own evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own evidence" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='evidence' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id='evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read own or staff evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='evidence' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));

-- Explicit RPC execution grants
GRANT EXECUTE ON FUNCTION public.kind_label(public.incident_kind) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trigger_sos(double precision, double precision, double precision, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_incident_status(uuid, public.incident_status, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_incident(uuid, uuid) TO authenticated, service_role;

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;

-- DEMO SEED (clearly labelled)
INSERT INTO public.safety_information(title,category,content,source,is_verified,verified_at,review_date,is_published,is_demo) VALUES
('[DEMO] What to do if you lose your passport','Lost passport','1. Report the loss to local police and ask for a written report.\n2. Contact your embassy or consulate to request an emergency travel document.\n3. Keep digital copies of your passport photo page stored securely.','Demo content — replace with an official source',true,now(),current_date + 180,true,true),
('[DEMO] General travel safety basics','General travel safety','Keep valuables out of sight, share your itinerary with a trusted contact, and note the local emergency number before you travel.','Demo content — replace with an official source',true,now(),current_date + 180,true,true),
('[DEMO] Heat illness warning signs','Medical emergency','Dizziness, headache, nausea and confusion can indicate heat exhaustion. Move to shade, drink water and seek medical help if symptoms worsen.','Demo content — not yet verified',false,NULL,NULL,true,true);

INSERT INTO public.emergency_resources(name,type,phone,address,operating_hours,latitude,longitude,is_verified,is_demo) VALUES
('[DEMO] Central Police Station','Police','Demo — not a real number','Demo address, City Centre','24 hours',12.9763,77.5929,false,true),
('[DEMO] City General Hospital','Hospital','Demo — not a real number','Demo address, Hospital Road','24 hours',12.9592,77.5968,false,true),
('[DEMO] Fire Station No. 1','Fire','Demo — not a real number','Demo address, Station Road','24 hours',12.9850,77.6050,false,true),
('[DEMO] Tourist Help Centre','Tourist assistance center','Demo — not a real number','Demo address, Main Square','09:00–18:00',12.9716,77.5946,false,true);

INSERT INTO public.safety_alerts(title,message,severity,area,is_active,is_demo) VALUES
('[DEMO] Heavy rain expected','Demo alert: heavy rain is forecast this evening. Avoid low-lying areas.','medium','City Centre (demo)',true,true);
