
-- 1. Expert compensation model
DO $$ BEGIN
  CREATE TYPE public.compensation_model AS ENUM ('referral_fee', 'wholesale', 'direct_bill');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS compensation_model public.compensation_model NOT NULL DEFAULT 'referral_fee',
  ADD COLUMN IF NOT EXISTS referral_fee_pct numeric CHECK (referral_fee_pct IS NULL OR (referral_fee_pct >= 0 AND referral_fee_pct <= 100));

-- 2. Subscription plans (catalog) + subscriptions
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  monthly_price_eur numeric NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.subscription_plans FOR SELECT USING (active = true);
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES public.subscription_plans(code),
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()));
CREATE POLICY "Users create own subscription" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON public.subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Cases: three-sided workspace
DO $$ BEGIN
  CREATE TYPE public.case_type AS ENUM (
    'bereavement','visa_application','visa_extension','nationality','family_reunification',
    'benefits_claim','housing','tax','education','healthcare','translation','driving','business','other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.case_status AS ENUM ('new','triage','in_progress','awaiting_client','awaiting_expert','on_hold','completed','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.case_participant_role AS ENUM ('client','case_manager','expert','observer','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BST-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  title text NOT NULL,
  case_type public.case_type NOT NULL,
  status public.case_status NOT NULL DEFAULT 'new',
  summary text,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  primary_expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL,
  urgent boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  city text,
  bundesland text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.case_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.case_participant_role NOT NULL,
  expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS case_participants_case_idx ON public.case_participants(case_id);
CREATE INDEX IF NOT EXISTS case_participants_user_idx ON public.case_participants(user_id);
GRANT SELECT, INSERT, DELETE ON public.case_participants TO authenticated;
GRANT ALL ON public.case_participants TO service_role;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;

-- Helper: can this user see this case?
CREATE OR REPLACE FUNCTION public.can_access_case(_user_id uuid, _case_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.cases c WHERE c.id = _case_id AND (c.client_user_id = _user_id OR c.case_manager_user_id = _user_id))
    OR EXISTS (SELECT 1 FROM public.case_participants p WHERE p.case_id = _case_id AND p.user_id = _user_id)
    OR public.is_internal(_user_id);
$$;

CREATE POLICY "Case visibility via helper" ON public.cases FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), id));
CREATE POLICY "Clients create own cases" ON public.cases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_user_id);
CREATE POLICY "Managers and internal update cases" ON public.cases FOR UPDATE TO authenticated
  USING (public.can_access_case(auth.uid(), id))
  WITH CHECK (public.can_access_case(auth.uid(), id));

CREATE POLICY "Participants list via case access" ON public.case_participants FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Internal adds participants" ON public.case_participants FOR INSERT TO authenticated
  WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "Internal removes participants" ON public.case_participants FOR DELETE TO authenticated
  USING (public.is_internal(auth.uid()));

-- 4. Tasks, documents, messages, quotes/invoices
CREATE TABLE IF NOT EXISTS public.case_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_role public.case_participant_role,
  due_at timestamptz,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_tasks_case_idx ON public.case_tasks(case_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_tasks TO authenticated;
GRANT ALL ON public.case_tasks TO service_role;
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Task read via case access" ON public.case_tasks FOR SELECT TO authenticated USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Task write via case access" ON public.case_tasks FOR INSERT TO authenticated WITH CHECK (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Task update via case access" ON public.case_tasks FOR UPDATE TO authenticated USING (public.can_access_case(auth.uid(), case_id)) WITH CHECK (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Task delete internal" ON public.case_tasks FOR DELETE TO authenticated USING (public.is_internal(auth.uid()));

CREATE TABLE IF NOT EXISTS public.case_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes int,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visible_to_expert boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_documents_case_idx ON public.case_documents(case_id);
GRANT SELECT, INSERT, DELETE ON public.case_documents TO authenticated;
GRANT ALL ON public.case_documents TO service_role;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doc read via case access" ON public.case_documents FOR SELECT TO authenticated USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Doc upload via case access" ON public.case_documents FOR INSERT TO authenticated WITH CHECK (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Doc delete uploader or internal" ON public.case_documents FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_internal(auth.uid()));

CREATE TABLE IF NOT EXISTS public.case_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  internal_note boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_messages_case_idx ON public.case_messages(case_id);
GRANT SELECT, INSERT ON public.case_messages TO authenticated;
GRANT ALL ON public.case_messages TO service_role;
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Message read via case access, internal notes internal-only" ON public.case_messages FOR SELECT TO authenticated
  USING (public.can_access_case(auth.uid(), case_id) AND (internal_note = false OR public.is_internal(auth.uid())));
CREATE POLICY "Message send via case access" ON public.case_messages FOR INSERT TO authenticated
  WITH CHECK (public.can_access_case(auth.uid(), case_id) AND sender_user_id = auth.uid());

-- Quotes: expert or manager proposes work + price to client
DO $$ BEGIN
  CREATE TYPE public.quote_status AS ENUM ('draft','sent','accepted','declined','expired','superseded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.case_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount_eur numeric NOT NULL,
  vat_pct numeric NOT NULL DEFAULT 19,
  compensation_model public.compensation_model NOT NULL DEFAULT 'referral_fee',
  platform_fee_pct numeric NOT NULL DEFAULT 10,
  platform_fee_eur numeric,
  status public.quote_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_quotes_case_idx ON public.case_quotes(case_id);
GRANT SELECT, INSERT, UPDATE ON public.case_quotes TO authenticated;
GRANT ALL ON public.case_quotes TO service_role;
ALTER TABLE public.case_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quote read via case access" ON public.case_quotes FOR SELECT TO authenticated USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Quote write via case access" ON public.case_quotes FOR INSERT TO authenticated WITH CHECK (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Quote update via case access" ON public.case_quotes FOR UPDATE TO authenticated USING (public.can_access_case(auth.uid(), case_id)) WITH CHECK (public.can_access_case(auth.uid(), case_id));

-- Invoices / payments (escrow-ready shell; Stripe fields wired in Phase 4)
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('pending','paid','held_escrow','released','refunded','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.case_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.case_quotes(id) ON DELETE SET NULL,
  expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL,
  amount_eur numeric NOT NULL,
  vat_eur numeric NOT NULL DEFAULT 0,
  platform_fee_eur numeric NOT NULL DEFAULT 0,
  payout_to_expert_eur numeric,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  paid_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_invoices_case_idx ON public.case_invoices(case_id);
GRANT SELECT, INSERT, UPDATE ON public.case_invoices TO authenticated;
GRANT ALL ON public.case_invoices TO service_role;
ALTER TABLE public.case_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invoice read via case access" ON public.case_invoices FOR SELECT TO authenticated USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Invoice write internal or manager" ON public.case_invoices FOR INSERT TO authenticated WITH CHECK (public.is_internal(auth.uid()));
CREATE POLICY "Invoice update internal or manager" ON public.case_invoices FOR UPDATE TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

-- 5. Audit log (append-only)
CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_events_case_idx ON public.case_events(case_id);
GRANT SELECT, INSERT ON public.case_events TO authenticated;
GRANT ALL ON public.case_events TO service_role;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event read via case access" ON public.case_events FOR SELECT TO authenticated USING (public.can_access_case(auth.uid(), case_id));
CREATE POLICY "Event append via case access" ON public.case_events FOR INSERT TO authenticated WITH CHECK (public.can_access_case(auth.uid(), case_id) AND actor_user_id = auth.uid());

-- 6. updated_at triggers
CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_case_tasks_updated BEFORE UPDATE ON public.case_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_case_quotes_updated BEFORE UPDATE ON public.case_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_case_invoices_updated BEFORE UPDATE ON public.case_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Seed subscription plans
INSERT INTO public.subscription_plans (code, name, tagline, monthly_price_eur, features, sort_order) VALUES
  ('basic', 'Basic', 'For everyday help settling in', 5,
   '["AI assistant in 13 languages","Checklists & document vault","Community & self-serve guides","In-house help: Anmeldung, benefit forms, phone & medical translation","Letter drafting & appointment booking","No extra charge when we do it in-house"]'::jsonb, 1),
  ('plus', 'Plus', 'Add-ons for work, study & tax', 10,
   '["Everything in Basic","Visa & extension tracking","Tax return preparation","Driving licence conversion","Education & university applications","Business set-up guidance","Priority case-manager response"]'::jsonb, 2),
  ('complete', 'Complete', 'Full case management for the big things', 25,
   '["Everything in Plus","Dedicated case manager","Full case management for death & bereavement","Visa, nationality & family reunification cases","Benefits, pensions & welfare cases","Faster SLAs","Covers your household"]'::jsonb, 3)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, tagline = EXCLUDED.tagline, monthly_price_eur = EXCLUDED.monthly_price_eur,
  features = EXCLUDED.features, sort_order = EXCLUDED.sort_order, updated_at = now();
