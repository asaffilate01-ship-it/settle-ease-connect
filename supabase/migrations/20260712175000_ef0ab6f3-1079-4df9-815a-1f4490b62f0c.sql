-- Staff portal rebuild — supporting columns for assignment, call log,
-- quote nudges, and expert status.

-- Leads: assignee + append-only call log
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS call_log jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS insurance_leads_assigned_to_idx
  ON public.insurance_leads (assigned_to);
CREATE INDEX IF NOT EXISTS insurance_leads_status_updated_idx
  ON public.insurance_leads (status, updated_at DESC);

-- Case quotes: last-nudged timestamp
ALTER TABLE public.case_quotes
  ADD COLUMN IF NOT EXISTS last_nudged_at timestamptz;

-- Experts: pause / active status
ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experts_status_chk'
  ) THEN
    ALTER TABLE public.experts
      ADD CONSTRAINT experts_status_chk CHECK (status IN ('active','paused'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS experts_status_idx ON public.experts (status);

-- Allow internal staff to UPDATE leads (assignment, notes, status).
-- Existing owner/read policies remain untouched.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'insurance_leads'
      AND policyname = 'Internal staff can update leads'
  ) THEN
    CREATE POLICY "Internal staff can update leads"
      ON public.insurance_leads
      FOR UPDATE
      TO authenticated
      USING (public.is_internal(auth.uid()))
      WITH CHECK (public.is_internal(auth.uid()));
  END IF;
END $$;

-- Allow internal staff to UPDATE quotes (nudge timestamp, status).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'case_quotes'
      AND policyname = 'Internal staff can update quotes'
  ) THEN
    CREATE POLICY "Internal staff can update quotes"
      ON public.case_quotes
      FOR UPDATE
      TO authenticated
      USING (public.is_internal(auth.uid()))
      WITH CHECK (public.is_internal(auth.uid()));
  END IF;
END $$;

-- Allow internal staff to UPDATE experts (pause/activate, edit).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'experts'
      AND policyname = 'Internal staff can update experts'
  ) THEN
    CREATE POLICY "Internal staff can update experts"
      ON public.experts
      FOR UPDATE
      TO authenticated
      USING (public.is_internal(auth.uid()))
      WITH CHECK (public.is_internal(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'experts'
      AND policyname = 'Internal staff can insert experts'
  ) THEN
    CREATE POLICY "Internal staff can insert experts"
      ON public.experts
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_internal(auth.uid()));
  END IF;
END $$;
