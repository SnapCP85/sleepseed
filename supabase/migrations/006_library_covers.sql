-- ============================================================================
-- 006_library_covers.sql
-- Add cover_url column to stories table for uploaded book covers
-- ============================================================================

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS cover_url text;

-- Create the library-covers storage bucket (run in Supabase dashboard):
-- 1. Go to Storage → New Bucket
-- 2. Name: "library-covers"
-- 3. Public bucket: YES
-- 4. Allowed MIME types: image/jpeg, image/png, image/webp
-- 5. Max file size: 5MB

-- Storage policy (run in SQL editor after bucket creation):
-- CREATE POLICY "library_covers_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'library-covers');
-- CREATE POLICY "library_covers_auth_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'library-covers' AND auth.role() = 'authenticated');
