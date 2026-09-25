-- ============================================================================
-- Travel Sathi — 01_enums_and_tables.sql
-- PostgreSQL Enums, Sequences, and Core Tables
-- ============================================================================

CREATE TYPE public.app_role AS ENUM ('tourist','responder','admin');
CREATE TYPE public.incident_kind AS ENUM ('sos','incident','assistance');
CREATE TYPE public.incident_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.incident_status AS ENUM (
  'submitted',
  'received',
  'assigned',
  'accepted',
  'en_route',
  'assistance_provided',
  'resolved',
  'cancelled'
);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- 1. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TOURIST PROFILES
CREATE TABLE public.tourist_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  nationality text,
  home_country text,
  languages text,
  medical_notes text,
  travel_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. EMERGENCY CONTACTS
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

-- 6. INCIDENTS
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
CREATE UNIQUE INDEX one_active_sos_per_user ON public.incidents(reporter_id)
  WHERE kind='sos' AND status NOT IN ('resolved','cancelled');
CREATE INDEX incidents_status_idx ON public.incidents(status);

-- 7. INCIDENT ASSIGNMENTS
CREATE TABLE public.incident_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES public.profiles(id),
  assigned_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. INCIDENT LOCATIONS (GPS Breadcrumbs)
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

-- 9. INCIDENT NOTES (Internal Staff Notes)
CREATE TABLE public.incident_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. INCIDENT TIMELINE
CREATE TABLE public.incident_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL,
  status public.incident_status,
  details text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 11. NOTIFICATIONS
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

-- 12. SAFETY INFORMATION
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

-- 13. EMERGENCY RESOURCES
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

-- 14. SAFETY ALERTS
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
