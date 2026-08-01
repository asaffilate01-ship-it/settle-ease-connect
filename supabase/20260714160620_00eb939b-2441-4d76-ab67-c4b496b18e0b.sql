
-- === Enums ===
CREATE TYPE public.health_triage_route AS ENUM (
  'statutory','private','student','employee','self_employed','family','needs_regulated_assessment'
);

CREATE TYPE public.dela_referral_status AS ENUM (
  'draft',
  'disclosure_shown',
  'marketing_consent',
  'info_collected',
  'contact_method_selected',
  'sent_to_partner',
  'partner_acknowledged',
  'application_submitted',
  'policy_accepted',
  'policy_declined',
  'commission_due',
  'commission_paid',
  'cancelled',
  'renewed'
);

-- === DELA referrals ===
CREATE TABLE public.dela_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT ('DELA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10))),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  crm_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,

  status public.dela_referral_status NOT NULL DEFAULT 'draft',

  -- Regulatory compliance (all evidence timestamps)
  disclosure_shown_at timestamptz,
  disclosure_version text,
  marketing_consent_at timestamptz,
  marketing_consent_evidence text,
  privacy_notice_version text,
  privacy_notice_shown_at timestamptz,

  -- Non-advisory basic information only (no suitability)
  full_name text,
  email text,
  phone text,
  preferred_language text,
  age integer,
  household_kind text,
  postcode text,

  -- Contact preferences
  contact_method text CHECK (contact_method IN ('email','phone','whatsapp','post')),
  contact_time_preference text,

  -- Partner-side lifecycle
  partner_id uuid REFERENCES public.referral_partners(id) ON DELETE SET NULL,
  sent_to_partner_at timestamptz,
  partner_acknowledged_at timestamptz,
  partner_case_reference text,
  application_submitted_at timestamptz,
  policy_accepted_at timestamptz,
  policy_declined_at timestamptz,
  policy_reference text,
  monthly_premium_eur numeric(10,2),
  benefit_amount_eur numeric(10,2),
  commission_amount_eur numeric(10,2),
  commission_status text DEFAULT 'pending' CHECK (commission_status IN ('pending','due','paid','clawed_back')),
  commission_paid_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  renewed_at timestamptz,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  advisor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.dela_referrals TO authenticated;
GRANT ALL ON public.dela_referrals TO service_role;
ALTER TABLE public.dela_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff read DELA referrals" ON public.dela_referrals FOR SELECT
  TO authenticated USING (public.is_internal(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Case managers can create DELA referrals" ON public.dela_referrals FOR INSERT
  TO authenticated WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Internal staff update DELA referrals" ON public.dela_referrals FOR UPDATE
  TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER trg_dela_referrals_updated BEFORE UPDATE ON public.dela_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dela_status ON public.dela_referrals(status);
CREATE INDEX idx_dela_user ON public.dela_referrals(user_id);

-- === Regulated action log (append-only) ===
CREATE TABLE public.regulated_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,           -- e.g. 'dela_advance_stage', 'insurance_recommend', 'suitability_write'
  target_table text,
  target_id uuid,
  allowed boolean NOT NULL,
  block_reason text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.regulated_action_log TO authenticated;
GRANT ALL ON public.regulated_action_log TO service_role;
ALTER TABLE public.regulated_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Compliance and admins read log" ON public.regulated_action_log FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'insurance_admin'));

CREATE POLICY "Authenticated can insert (system + trigger writes)" ON public.regulated_action_log FOR INSERT
  TO authenticated WITH CHECK (actor_user_id = auth.uid() OR public.is_internal(auth.uid()));

-- No UPDATE / DELETE policies = append-only via Data API.

-- === Health-insurance triage ===
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS triage_route public.health_triage_route,
  ADD COLUMN IF NOT EXISTS triage_notes text,
  ADD COLUMN IF NOT EXISTS triage_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS triage_at timestamptz,
  ADD COLUMN IF NOT EXISTS advice_notes text,          -- regulated: advisor only
  ADD COLUMN IF NOT EXISTS recommendation_text text,   -- regulated: advisor only
  ADD COLUMN IF NOT EXISTS suitability_notes text;     -- regulated: advisor only

-- === Regulated firewall function ===
CREATE OR REPLACE FUNCTION public.is_licensed_advisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','insurance_admin')
  );
$$;

-- Trigger: prevent unlicensed staff writing regulated fields or advancing past 'consent_to_contact'
CREATE OR REPLACE FUNCTION public.insurance_leads_regulated_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  advancing_past_consent boolean := false;
  writing_regulated boolean := false;
  post_consent_stages text[] := ARRAY['referral','regulated_advice','application','policy_accepted','commission_due','commission_paid'];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.stage::text = ANY(post_consent_stages)
       AND (OLD.stage IS DISTINCT FROM NEW.stage) THEN
      advancing_past_consent := true;
    END IF;

    IF (NEW.advice_notes IS DISTINCT FROM OLD.advice_notes)
       OR (NEW.recommendation_text IS DISTINCT FROM OLD.recommendation_text)
       OR (NEW.suitability_notes IS DISTINCT FROM OLD.suitability_notes) THEN
      writing_regulated := true;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.advice_notes IS NOT NULL OR NEW.recommendation_text IS NOT NULL OR NEW.suitability_notes IS NOT NULL THEN
      writing_regulated := true;
    END IF;
  END IF;

  IF (advancing_past_consent OR writing_regulated) AND NOT public.is_licensed_advisor(auth.uid()) THEN
    INSERT INTO public.regulated_action_log (actor_user_id, action, target_table, target_id, allowed, block_reason, payload)
    VALUES (auth.uid(),
            CASE WHEN advancing_past_consent THEN 'insurance_advance_regulated_stage' ELSE 'insurance_write_regulated_field' END,
            'insurance_leads', NEW.id, false,
            'Actor is not a licensed advisor',
            jsonb_build_object('new_stage', NEW.stage, 'old_stage', OLD.stage));
    RAISE EXCEPTION 'Regulated action blocked: only licensed insurance advisors can advance leads past consent or record advice.';
  END IF;

  -- Allowed advisor action → log for audit
  IF (advancing_past_consent OR writing_regulated) THEN
    INSERT INTO public.regulated_action_log (actor_user_id, actor_role, action, target_table, target_id, allowed, payload)
    VALUES (auth.uid(), 'insurance_admin',
            CASE WHEN advancing_past_consent THEN 'insurance_advance_regulated_stage' ELSE 'insurance_write_regulated_field' END,
            'insurance_leads', NEW.id, true,
            jsonb_build_object('new_stage', NEW.stage, 'old_stage', OLD.stage));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_insurance_leads_regulated_guard ON public.insurance_leads;
CREATE TRIGGER trg_insurance_leads_regulated_guard
  BEFORE INSERT OR UPDATE ON public.insurance_leads
  FOR EACH ROW EXECUTE FUNCTION public.insurance_leads_regulated_guard();

-- Same firewall for DELA referrals: only advisors can move past marketing consent
CREATE OR REPLACE FUNCTION public.dela_regulated_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  regulated_statuses text[] := ARRAY['application_submitted','policy_accepted','policy_declined','commission_due','commission_paid','renewed'];
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status::text = ANY(regulated_statuses)
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NOT public.is_licensed_advisor(auth.uid()) THEN
    INSERT INTO public.regulated_action_log (actor_user_id, action, target_table, target_id, allowed, block_reason, payload)
    VALUES (auth.uid(), 'dela_advance_regulated_stage', 'dela_referrals', NEW.id, false,
            'Actor is not a licensed advisor',
            jsonb_build_object('new_status', NEW.status, 'old_status', OLD.status));
    RAISE EXCEPTION 'Only licensed insurance advisors can record DELA policy outcomes or commissions.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dela_regulated_guard ON public.dela_referrals;
CREATE TRIGGER trg_dela_regulated_guard
  BEFORE UPDATE ON public.dela_referrals
  FOR EACH ROW EXECUTE FUNCTION public.dela_regulated_guard();
