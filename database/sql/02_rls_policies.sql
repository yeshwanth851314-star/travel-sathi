-- ============================================================================
-- Travel Sathi — 02_rls_policies.sql
-- Role Helper Functions, Table Grants, and Row-Level Security (RLS) Policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('responder','admin'))
$$;

-- PROFILES & ROLES
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.tourist_profiles TO authenticated;
GRANT ALL ON public.tourist_profiles TO service_role;
ALTER TABLE public.tourist_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read tourist" ON public.tourist_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own tourist insert" ON public.tourist_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tourist update" ON public.tourist_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- AUDIT LOGS
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- EMERGENCY CONTACTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.emergency_contacts FOR ALL TO authenticated
  USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "staff read contacts" ON public.emergency_contacts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- INCIDENTS & RELATED TABLES
GRANT SELECT, INSERT ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read incidents" ON public.incidents FOR SELECT TO authenticated
  USING (reporter_id=auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "tourist creates own reports" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (reporter_id=auth.uid() AND status='submitted' AND kind IN ('incident','assistance') AND assigned_responder_id IS NULL);

GRANT SELECT ON public.incident_assignments TO authenticated;
GRANT ALL ON public.incident_assignments TO service_role;
ALTER TABLE public.incident_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read assignments" ON public.incident_assignments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid())
);

GRANT SELECT, INSERT ON public.incident_locations TO authenticated;
GRANT ALL ON public.incident_locations TO service_role;
ALTER TABLE public.incident_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read locations" ON public.incident_locations FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid())
);
CREATE POLICY "reporter adds location to active incident" ON public.incident_locations FOR INSERT TO authenticated WITH CHECK (
  user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid() AND i.status NOT IN ('resolved','cancelled'))
);

GRANT SELECT, INSERT ON public.incident_notes TO authenticated;
GRANT ALL ON public.incident_notes TO service_role;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes" ON public.incident_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff add notes" ON public.incident_notes FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid() AND public.is_staff(auth.uid()));

GRANT SELECT ON public.incident_timeline TO authenticated;
GRANT ALL ON public.incident_timeline TO service_role;
ALTER TABLE public.incident_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read timeline" ON public.incident_timeline FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id=incident_id AND i.reporter_id=auth.uid())
);

-- NOTIFICATIONS
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- SAFETY INFORMATION, RESOURCES, ALERTS
GRANT SELECT ON public.safety_information TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_information TO authenticated;
GRANT ALL ON public.safety_information TO service_role;
ALTER TABLE public.safety_information ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published info" ON public.safety_information FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage info" ON public.safety_information FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

GRANT SELECT ON public.emergency_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_resources TO authenticated;
GRANT ALL ON public.emergency_resources TO service_role;
ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read resources" ON public.emergency_resources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage resources" ON public.emergency_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

GRANT SELECT ON public.safety_alerts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_alerts TO authenticated;
GRANT ALL ON public.safety_alerts TO service_role;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active alerts" ON public.safety_alerts FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage alerts" ON public.safety_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REALTIME PUBLICATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
