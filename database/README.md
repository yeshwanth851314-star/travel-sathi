# Travel Sathi — Database Layer (`database/`)

This directory contains the PostgreSQL database schema, Row-Level Security (RLS) policies, `SECURITY DEFINER` RPC functions, database triggers, storage bucket configuration, and TypeScript schema definitions for **Travel Sathi**.

## Structure

- **`config.toml`** — Supabase CLI project configuration.
- **`migrations/`** — Timestamped Supabase SQL migrations applied in order (`20260925172743_ea28c52b-e18a-448c-a4e4-5cb2612bedcc.sql`).
- **`sql/`** — Modular SQL reference files separated by domain:
  1. `01_enums_and_tables.sql` — Custom enums (`app_role`, `incident_kind`, `incident_severity`, `incident_status`) and all 14 tables (`profiles`, `tourist_profiles`, `user_roles`, `audit_logs`, `emergency_contacts`, `incidents`, `incident_assignments`, `incident_locations`, `incident_notes`, `incident_timeline`, `notifications`, `safety_information`, `emergency_resources`, `safety_alerts`).
  2. `02_rls_policies.sql` — Helper security functions (`has_role`, `is_staff`), table grants, Row-Level Security policies, and `supabase_realtime` publications.
  3. `03_rpc_functions_and_triggers.sql` — Core transactional RPCs (`trigger_sos`, `update_incident_status`, `assign_incident`, `set_user_role`, `notify_staff`, `log_audit`) and automated triggers (`on_auth_user_created`, `on_incident_created`, `on_location_added`, `on_note_added`, `on_info_change`, `on_resource_change`, `on_alert_change`).
  4. `04_storage_buckets.sql` — Private `evidence` storage bucket and folder-scoped RLS policies (`{user_id}/{incident_id}/{filename}`).
  5. `05_seed_data.sql` — Clearly labelled `[DEMO]` safety guides, emergency resources, and safety alerts.
- **`types.ts`** — Canonical TypeScript `Database` type definitions used by both `backend/` and `frontend/`.
