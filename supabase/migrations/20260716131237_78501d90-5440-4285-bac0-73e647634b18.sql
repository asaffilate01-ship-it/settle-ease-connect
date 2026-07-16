
-- Case appointments
CREATE TABLE public.case_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  meeting_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  attendee_user_ids uuid[] NOT NULL DEFAULT '{}',
  attendee_emails text[] NOT NULL DEFAULT '{}',
  reminder_minutes int DEFAULT 60,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_appointments TO authenticated;
GRANT ALL ON public.case_appointments TO service_role;

ALTER TABLE public.case_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case members and staff view appointments"
  ON public.case_appointments FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), case_id));

CREATE POLICY "case members and staff manage appointments"
  ON public.case_appointments FOR INSERT TO authenticated
  WITH CHECK (public.can_access_case(auth.uid(), case_id));

CREATE POLICY "case members and staff update appointments"
  ON public.case_appointments FOR UPDATE TO authenticated
  USING (public.can_access_case(auth.uid(), case_id))
  WITH CHECK (public.can_access_case(auth.uid(), case_id));

CREATE POLICY "case members and staff delete appointments"
  ON public.case_appointments FOR DELETE TO authenticated
  USING (public.can_access_case(auth.uid(), case_id));

CREATE TRIGGER update_case_appointments_updated_at
  BEFORE UPDATE ON public.case_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_case_appointments_case ON public.case_appointments(case_id, starts_at);
CREATE INDEX idx_case_appointments_time ON public.case_appointments(starts_at) WHERE status = 'scheduled';

-- Case closure workflow
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_reason text,
  ADD COLUMN IF NOT EXISTS closure_csat_requested boolean NOT NULL DEFAULT false;

-- SLA status helper (view over cases)
CREATE OR REPLACE VIEW public.case_sla_status AS
SELECT
  c.id AS case_id,
  c.title,
  c.status,
  c.priority,
  c.risk_level,
  c.current_stage,
  c.template_code,
  c.case_manager_user_id,
  c.client_user_id,
  c.sla_due_at,
  CASE
    WHEN c.sla_due_at IS NULL THEN 'none'
    WHEN c.status IN ('closed','cancelled') THEN 'closed'
    WHEN c.sla_due_at < now() THEN 'breached'
    WHEN c.sla_due_at < now() + interval '24 hours' THEN 'at_risk'
    ELSE 'on_track'
  END AS sla_state,
  EXTRACT(EPOCH FROM (c.sla_due_at - now()))/3600.0 AS hours_remaining
FROM public.cases c;

GRANT SELECT ON public.case_sla_status TO authenticated;

-- Function to close a case with a closure report + optional CSAT trigger
CREATE OR REPLACE FUNCTION public.close_case(
  _case_id uuid,
  _closure_reason text,
  _closure_report jsonb,
  _request_csat boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _client uuid;
BEGIN
  IF NOT public.can_access_case(auth.uid(), _case_id) THEN
    RAISE EXCEPTION 'Not authorised for this case';
  END IF;

  IF _closure_report IS NULL OR _closure_report = '{}'::jsonb THEN
    RAISE EXCEPTION 'Closure report is required to close a case';
  END IF;

  UPDATE public.cases
     SET status = 'closed',
         closed_at = now(),
         closure_reason = _closure_reason,
         closure_report = _closure_report,
         closure_csat_requested = _request_csat
   WHERE id = _case_id
   RETURNING client_user_id INTO _client;

  IF _request_csat AND _client IS NOT NULL THEN
    INSERT INTO public.crm_satisfaction (case_id, user_id, score, source, comment)
    VALUES (_case_id, _client, NULL, 'case_closure_request', NULL)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
