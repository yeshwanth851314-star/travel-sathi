-- Allow anon role to evaluate RLS policies that call has_role(auth.uid(), ...) or is_staff(auth.uid())
-- When anon calls auth.uid(), it returns NULL, so has_role(NULL, ...) safely returns false.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.is_staff(uuid), public.kind_label(public.incident_kind) TO anon, authenticated, service_role;
