
-- 1. Expand app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'family_deputy';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'senior_case_manager'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_leader'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dpo'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Lawyer / admin summary doc type
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS doc_type text NOT NULL DEFAULT 'general';
CREATE INDEX IF NOT EXISTS case_documents_doc_type_idx ON public.case_documents(doc_type);

-- 3. Storage policies for partner-docs bucket
-- Partner members can read their org docs; partner admins can upload/update/delete.
CREATE POLICY "partner_docs_read_own_org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'partner-docs'
    AND (
      public.is_internal(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.partner_users pu
        WHERE pu.user_id = auth.uid() AND pu.status = 'active'
          AND (storage.foldername(name))[1] = pu.org_id::text
      )
    )
  );

CREATE POLICY "partner_docs_write_own_org_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-docs'
    AND EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.user_id = auth.uid() AND pu.status = 'active' AND pu.is_admin = true
        AND (storage.foldername(name))[1] = pu.org_id::text
    )
  );

CREATE POLICY "partner_docs_update_own_org_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'partner-docs'
    AND EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.user_id = auth.uid() AND pu.status = 'active' AND pu.is_admin = true
        AND (storage.foldername(name))[1] = pu.org_id::text
    )
  );

CREATE POLICY "partner_docs_delete_own_org_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'partner-docs'
    AND EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.user_id = auth.uid() AND pu.status = 'active' AND pu.is_admin = true
        AND (storage.foldername(name))[1] = pu.org_id::text
    )
  );

-- 4. SLA sweep function + hourly cron
CREATE OR REPLACE FUNCTION public.sla_breach_sweep()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  inserted int := 0;
  c RECORD;
BEGIN
  FOR c IN
    SELECT c.id, c.title, c.case_manager_user_id, c.client_user_id, c.sla_due_at
      FROM public.cases c
     WHERE c.sla_due_at IS NOT NULL
       AND c.sla_due_at < now()
       AND c.status NOT IN ('closed','cancelled')
  LOOP
    -- Notify case manager if not already notified for this due timestamp
    IF c.case_manager_user_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.notifications n
          WHERE n.user_id = c.case_manager_user_id
            AND n.category = 'sla_breach'
            AND n.related_id = c.id::text
            AND n.created_at > c.sla_due_at
       ) THEN
      INSERT INTO public.notifications (user_id, category, title, body, related_id, priority)
      VALUES (c.case_manager_user_id, 'sla_breach',
              'SLA breached: ' || c.title,
              'This case has passed its SLA deadline. Please review.',
              c.id::text, 'high');
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END $fn$;

REVOKE ALL ON FUNCTION public.sla_breach_sweep() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sla_breach_sweep() TO service_role;
