-- Sensitive-data hardening: malware quarantine, explicit AI consent and short
-- retention. New vault objects fail closed until an external scanner marks
-- them clean through the authenticated internal callback.

BEGIN;

ALTER TABLE public.vault_documents
  ADD COLUMN IF NOT EXISTS scan_status text,
  ADD COLUMN IF NOT EXISTS scan_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scan_message text;

UPDATE public.vault_documents
   SET scan_status = CASE WHEN storage_path IS NULL THEN 'not_required' ELSE 'clean' END
 WHERE scan_status IS NULL;

ALTER TABLE public.vault_documents
  ALTER COLUMN scan_status SET DEFAULT 'pending',
  ALTER COLUMN scan_status SET NOT NULL;

ALTER TABLE public.vault_documents
  DROP CONSTRAINT IF EXISTS vault_documents_scan_status_check;
ALTER TABLE public.vault_documents
  ADD CONSTRAINT vault_documents_scan_status_check
  CHECK (scan_status IN ('pending','clean','rejected','error','not_required'));

CREATE INDEX IF NOT EXISTS vault_documents_scan_queue
  ON public.vault_documents(scan_status, created_at)
  WHERE storage_path IS NOT NULL AND scan_status IN ('pending','error');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Uploads are issued as narrowly scoped signed upload URLs by the server.
-- Removing the generic insert policy prevents authenticated clients from
-- filling arbitrary object paths in the bucket.
DROP POLICY IF EXISTS "vault owner uploads own files" ON storage.objects;

DROP POLICY IF EXISTS "vault owner reads own files with assurance" ON storage.objects;
CREATE POLICY "vault owner reads clean files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id = auth.uid()
         AND vd.scan_status = 'clean'
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );

DROP POLICY IF EXISTS "vault deputy reads allowed files with assurance" ON storage.objects;
CREATE POLICY "vault deputy reads allowed clean files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id::text = (storage.foldername(name))[1]
         AND vd.scan_status = 'clean'
         AND public.vault_deputy_can_read(auth.uid(), vd.owner_user_id, vd.category)
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );

CREATE TABLE IF NOT EXISTS public.ai_processing_consents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consented boolean NOT NULL DEFAULT false,
  purposes text[] NOT NULL DEFAULT '{}'::text[],
  notice_version text NOT NULL DEFAULT '2026-08-02',
  provider text NOT NULL DEFAULT 'lovable-ai-gateway',
  consented_at timestamptz,
  withdrawn_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_consent_purposes_check CHECK (
    purposes <@ ARRAY['family_guidance','document_analysis','staff_knowledge']::text[]
  )
);

ALTER TABLE public.ai_processing_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_processing_consents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_processing_consents TO authenticated;
GRANT ALL ON public.ai_processing_consents TO service_role;

CREATE POLICY "members read own AI consent"
  ON public.ai_processing_consents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "aal2 members create own AI consent"
  ON public.ai_processing_consents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth.jwt()->>'aal' = 'aal2');
CREATE POLICY "aal2 members update own AI consent"
  ON public.ai_processing_consents FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND auth.jwt()->>'aal' = 'aal2')
  WITH CHECK (user_id = auth.uid() AND auth.jwt()->>'aal' = 'aal2');

ALTER TABLE public.ai_document_analyses
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'lovable-ai-gateway',
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS retention_due_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

ALTER TABLE public.ai_document_analyses
  DROP CONSTRAINT IF EXISTS ai_document_analyses_kind_check;
ALTER TABLE public.ai_document_analyses
  ADD CONSTRAINT ai_document_analyses_kind_check
  CHECK (kind IN ('summary','eligibility_extract','kb_answer','family_assistant'));

-- Prompts are not retained. Generated output remains available for 30 days so
-- a member or case worker can review it, then the scheduled cleanup removes it.
UPDATE public.ai_document_analyses SET input_excerpt = NULL;
REVOKE INSERT, UPDATE, DELETE ON public.ai_document_analyses FROM authenticated;
DROP POLICY IF EXISTS "own or internal write" ON public.ai_document_analyses;

CREATE OR REPLACE FUNCTION public.purge_expired_ai_analyses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.ai_document_analyses
   WHERE retention_due_at <= now();
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_ai_analyses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_ai_analyses() TO service_role;

COMMIT;
