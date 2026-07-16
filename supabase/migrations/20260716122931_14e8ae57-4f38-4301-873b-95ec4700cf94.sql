
-- Enums
CREATE TYPE public.crm_lead_stage AS ENUM (
  'new','contact_attempted','assessed','consented','service_identified',
  'membership_proposed','insurance_referral_offered','referred_to_partner',
  'partner_outcome','onboarded','ongoing','lost'
);
CREATE TYPE public.crm_lead_type AS ENUM (
  'general','membership','insurance','funeral','legal','tax','benefits',
  'immigration','translation','healthcare','other'
);
CREATE TYPE public.crm_consent_purpose AS ENUM (
  'marketing','contact','insurance_referral','data_share_partner','regulated_advice'
);
CREATE TYPE public.crm_activity_kind AS ENUM (
  'call','email','whatsapp','sms','meeting','note','system'
);
CREATE TYPE public.crm_complaint_status AS ENUM (
  'open','in_review','resolved','rejected','withdrawn'
);

-- =========================================================
-- crm_contacts
-- =========================================================
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'de',
  city TEXT,
  bundesland TEXT,
  country TEXT,
  source TEXT,
  campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  merged_into_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_contacts_email_idx ON public.crm_contacts (lower(email));
CREATE INDEX crm_contacts_phone_idx ON public.crm_contacts (phone);
CREATE INDEX crm_contacts_merged_idx ON public.crm_contacts (merged_into_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_contacts internal all" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER trg_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- crm_campaigns
-- =========================================================
CREATE TABLE public.crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  budget_eur NUMERIC(10,2),
  starts_at DATE,
  ends_at DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_campaigns TO authenticated;
GRANT ALL ON public.crm_campaigns TO service_role;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_campaigns internal all" ON public.crm_campaigns
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_crm_campaigns_updated_at BEFORE UPDATE ON public.crm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- crm_consents (append-only-ish; revoke by setting revoked_at)
-- =========================================================
CREATE TABLE public.crm_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose public.crm_consent_purpose NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  method TEXT,
  evidence TEXT,
  language TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_consents_subject_chk CHECK (contact_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE INDEX crm_consents_contact_idx ON public.crm_consents (contact_id);
CREATE INDEX crm_consents_user_idx ON public.crm_consents (user_id);
CREATE INDEX crm_consents_purpose_idx ON public.crm_consents (purpose);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_consents TO authenticated;
GRANT ALL ON public.crm_consents TO service_role;
ALTER TABLE public.crm_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_consents internal all" ON public.crm_consents
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "crm_consents user read own" ON public.crm_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =========================================================
-- crm_leads
-- =========================================================
CREATE TABLE public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL DEFAULT ('L-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_type public.crm_lead_type NOT NULL DEFAULT 'general',
  stage public.crm_lead_stage NOT NULL DEFAULT 'new',
  source TEXT,
  campaign_id UUID REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  service_interest TEXT[] NOT NULL DEFAULT '{}',
  language TEXT,
  sla_due_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  lost_reason TEXT,
  converted_case_id UUID,
  converted_insurance_lead_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_leads_subject_chk CHECK (contact_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE INDEX crm_leads_stage_idx ON public.crm_leads (stage, updated_at DESC);
CREATE INDEX crm_leads_owner_idx ON public.crm_leads (owner_user_id);
CREATE INDEX crm_leads_contact_idx ON public.crm_leads (contact_id);
CREATE INDEX crm_leads_user_idx ON public.crm_leads (user_id);
CREATE INDEX crm_leads_next_action_idx ON public.crm_leads (next_action_at) WHERE next_action_at IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_leads internal all" ON public.crm_leads
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- crm_activities
-- =========================================================
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  kind public.crm_activity_kind NOT NULL,
  direction TEXT,
  subject TEXT,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  outcome TEXT,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_activities_lead_idx ON public.crm_activities (lead_id, occurred_at DESC);
CREATE INDEX crm_activities_contact_idx ON public.crm_activities (contact_id, occurred_at DESC);
CREATE INDEX crm_activities_user_idx ON public.crm_activities (user_id, occurred_at DESC);
CREATE INDEX crm_activities_case_idx ON public.crm_activities (case_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_activities internal all" ON public.crm_activities
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

-- =========================================================
-- crm_follow_ups
-- =========================================================
CREATE TABLE public.crm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  channel TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  snoozed_until TIMESTAMPTZ,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_follow_ups_due_idx ON public.crm_follow_ups (done, due_at);
CREATE INDEX crm_follow_ups_assignee_idx ON public.crm_follow_ups (assignee_user_id, due_at);
CREATE INDEX crm_follow_ups_lead_idx ON public.crm_follow_ups (lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_follow_ups TO authenticated;
GRANT ALL ON public.crm_follow_ups TO service_role;
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_follow_ups internal all" ON public.crm_follow_ups
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_crm_follow_ups_updated_at BEFORE UPDATE ON public.crm_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- crm_complaints
-- =========================================================
CREATE TABLE public.crm_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL DEFAULT ('C-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'normal',
  status public.crm_complaint_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  satisfaction_score INTEGER,
  assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_complaints_status_idx ON public.crm_complaints (status, opened_at DESC);
CREATE INDEX crm_complaints_user_idx ON public.crm_complaints (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_complaints TO authenticated;
GRANT ALL ON public.crm_complaints TO service_role;
ALTER TABLE public.crm_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_complaints internal all" ON public.crm_complaints
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "crm_complaints user read own" ON public.crm_complaints
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "crm_complaints user insert own" ON public.crm_complaints
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_crm_complaints_updated_at BEFORE UPDATE ON public.crm_complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- crm_satisfaction
-- =========================================================
CREATE TABLE public.crm_satisfaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  nps_category TEXT,
  comments TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_satisfaction_case_idx ON public.crm_satisfaction (case_id);
CREATE INDEX crm_satisfaction_user_idx ON public.crm_satisfaction (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_satisfaction TO authenticated;
GRANT ALL ON public.crm_satisfaction TO service_role;
ALTER TABLE public.crm_satisfaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_satisfaction internal all" ON public.crm_satisfaction
  FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "crm_satisfaction user manage own" ON public.crm_satisfaction
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================
-- Extend insurance_leads for the regulated pipeline
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.insurance_lead_stage AS ENUM (
    'enquiry','marketing_lead','consent_to_contact','referral',
    'regulated_advice','application','policy_accepted',
    'commission_due','commission_paid','declined','lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS stage public.insurance_lead_stage NOT NULL DEFAULT 'enquiry',
  ADD COLUMN IF NOT EXISTS crm_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_id UUID,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS commission_status TEXT,
  ADD COLUMN IF NOT EXISTS policy_reference TEXT,
  ADD COLUMN IF NOT EXISTS regulated_advisor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS insurance_leads_stage_idx ON public.insurance_leads (stage, updated_at DESC);
