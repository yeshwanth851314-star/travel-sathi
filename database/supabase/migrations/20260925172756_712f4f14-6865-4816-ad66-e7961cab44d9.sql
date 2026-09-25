
ALTER FUNCTION public.kind_label(public.incident_kind) SET search_path=public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_staff(uuid), public.trigger_sos(double precision,double precision,double precision,text,text),
  public.update_incident_status(uuid, public.incident_status, text), public.assign_incident(uuid,uuid), public.set_user_role(uuid, public.app_role),
  public.handle_new_user(), public.on_incident_created(), public.on_location_added(), public.on_note_added(), public.on_info_change(),
  public.on_resource_change(), public.on_alert_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.on_incident_created(), public.on_location_added(), public.on_note_added(),
  public.on_info_change(), public.on_resource_change(), public.on_alert_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_staff(uuid), public.trigger_sos(double precision,double precision,double precision,text,text),
  public.update_incident_status(uuid, public.incident_status, text), public.assign_incident(uuid,uuid), public.set_user_role(uuid, public.app_role) TO authenticated;
