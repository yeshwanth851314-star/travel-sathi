-- ============================================================================
-- Travel Sathi — 04_storage_buckets.sql
-- Private Evidence Storage Bucket & Storage Object RLS Policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users upload own evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "read own or staff evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='evidence' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));
