-- Lock down remaining privilege escalation paths:
-- 1. member_referrals: the self-update policy must only allow safe columns.
-- 2. cases: clients can only update client-facing fields, not status/assignment/closure.

-- MEMBER REFERRALS
CREATE OR REPLACE FUNCTION public.member_referrals_update_is_safe(
  _id uuid,
  _status text,
  _reward_type text,
  _reward_value_eur numeric,
  _rewarded_at timestamp with time zone
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.member_referrals m
    WHERE m.id = _id
      AND (
        m.status IS DISTINCT FROM _status
        OR m.reward_type IS DISTINCT FROM _reward_type
        OR m.reward_value_eur IS DISTINCT FROM _reward_value_eur
        OR m.rewarded_at IS DISTINCT FROM _rewarded_at
      )
  );
$$;

DROP POLICY IF EXISTS "own referrals update safe" ON public.member_referrals;
CREATE POLICY "own referrals update safe"
  ON public.member_referrals
  FOR UPDATE
  TO authenticated
  USING (referrer_user_id = auth.uid())
  WITH CHECK (
    referrer_user_id = auth.uid()
    AND public.member_referrals_update_is_safe(
      id, status, reward_type, reward_value_eur, rewarded_at
    )
  );

-- CASES
-- Replace the broad manager update policy with one scoped to internal users only.
DROP POLICY IF EXISTS "Managers and internal update cases" ON public.cases;

CREATE POLICY "Internal staff update cases"
  ON public.cases
  FOR UPDATE
  TO authenticated
  USING (is_internal(auth.uid()))
  WITH CHECK (is_internal(auth.uid()));

-- Clients can only update their own summary and a few contact/preferences fields.
CREATE OR REPLACE FUNCTION public.cases_client_update_is_safe(
  _id uuid,
  _summary text,
  _language text,
  _city text,
  _bundesland text,
  _urgent boolean
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.cases c
    WHERE c.id = _id
      AND (
        c.summary IS DISTINCT FROM _summary
        OR c.language IS DISTINCT FROM _language
        OR c.city IS DISTINCT FROM _city
        OR c.bundesland IS DISTINCT FROM _bundesland
        OR c.urgent IS DISTINCT FROM _urgent
      )
      -- If we got here, the user is trying to change something other than the
      -- allowed client fields. We must block this by returning false.
  ) IS FALSE;
$$;

-- Simpler: use a trigger to lock non-client fields for clients.
CREATE OR REPLACE FUNCTION public.cases_client_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_internal(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.client_user_id IS DISTINCT FROM OLD.client_user_id THEN
    RAISE EXCEPTION 'Clients cannot reassign case ownership';
  END IF;
  IF NEW.case_manager_user_id IS DISTINCT FROM OLD.case_manager_user_id THEN
    RAISE EXCEPTION 'Clients cannot change case manager';
  END IF;
  IF NEW.primary_expert_id IS DISTINCT FROM OLD.primary_expert_id THEN
    RAISE EXCEPTION 'Clients cannot change assigned expert';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Clients cannot change case status';
  END IF;
  IF NEW.template_code IS DISTINCT FROM OLD.template_code THEN
    RAISE EXCEPTION 'Clients cannot change case template';
  END IF;
  IF NEW.current_stage IS DISTINCT FROM OLD.current_stage THEN
    RAISE EXCEPTION 'Clients cannot advance case stage';
  END IF;
  IF NEW.sla_due_at IS DISTINCT FROM OLD.sla_due_at THEN
    RAISE EXCEPTION 'Clients cannot change SLA deadline';
  END IF;
  IF NEW.risk_level IS DISTINCT FROM OLD.risk_level THEN
    RAISE EXCEPTION 'Clients cannot change risk level';
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    RAISE EXCEPTION 'Clients cannot change priority';
  END IF;
  IF NEW.closure_report IS DISTINCT FROM OLD.closure_report THEN
    RAISE EXCEPTION 'Clients cannot edit closure report';
  END IF;
  IF NEW.closure_reason IS DISTINCT FROM OLD.closure_reason THEN
    RAISE EXCEPTION 'Clients cannot edit closure reason';
  END IF;
  IF NEW.closure_csat_requested IS DISTINCT FROM OLD.closure_csat_requested THEN
    RAISE EXCEPTION 'Clients cannot edit closure feedback settings';
  END IF;
  IF NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
    RAISE EXCEPTION 'Clients cannot close a case';
  END IF;
  IF NEW.reference IS DISTINCT FROM OLD.reference THEN
    RAISE EXCEPTION 'Clients cannot edit case reference';
  END IF;
  IF NEW.title IS DISTINCT FROM OLD.title THEN
    RAISE EXCEPTION 'Clients cannot edit case title';
  END IF;
  IF NEW.case_type IS DISTINCT FROM OLD.case_type THEN
    RAISE EXCEPTION 'Clients cannot change case type';
  END IF;
  IF NEW.opened_at IS DISTINCT FROM OLD.opened_at THEN
    RAISE EXCEPTION 'Clients cannot edit case dates';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cases_client_update_guard ON public.cases;
CREATE TRIGGER trg_cases_client_update_guard
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.cases_client_update_guard();

-- Allow clients to update their own cases (the trigger enforces the field lockdown).
CREATE POLICY "Clients update own cases safely"
  ON public.cases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_user_id)
  WITH CHECK (auth.uid() = client_user_id);
