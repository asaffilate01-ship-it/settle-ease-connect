
-- Family funeral cover: leads (upsell capture) + policies (bound records)

CREATE TABLE public.funeral_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  household_kind TEXT NOT NULL DEFAULT 'family',
  adults_count INT NOT NULL DEFAULT 2,
  children_count INT NOT NULL DEFAULT 0,
  target_benefit_eur INT NOT NULL DEFAULT 20000,
  city TEXT,
  bundesland TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','quoted','bound','declined','withdrawn')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.funeral_leads TO authenticated;
GRANT ALL ON public.funeral_leads TO service_role;

ALTER TABLE public.funeral_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own funeral leads"
  ON public.funeral_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users read their own funeral leads"
  ON public.funeral_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()));

CREATE POLICY "Internal manages funeral leads"
  ON public.funeral_leads FOR ALL
  TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER funeral_leads_updated_at
  BEFORE UPDATE ON public.funeral_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funeral_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.funeral_leads(id) ON DELETE SET NULL,
  policy_number TEXT,
  insurer_name TEXT NOT NULL,
  benefit_eur INT NOT NULL,
  premium_eur NUMERIC(10,2) NOT NULL,
  premium_cadence TEXT NOT NULL DEFAULT 'monthly'
    CHECK (premium_cadence IN ('monthly','quarterly','yearly','single')),
  household_kind TEXT NOT NULL DEFAULT 'family',
  adults_covered INT NOT NULL DEFAULT 2,
  children_covered INT NOT NULL DEFAULT 0,
  start_date DATE,
  renewal_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','lapsed','cancelled','claimed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.funeral_policies TO authenticated;
GRANT ALL ON public.funeral_policies TO service_role;

ALTER TABLE public.funeral_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own funeral policies"
  ON public.funeral_policies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()));

CREATE POLICY "Internal manages funeral policies"
  ON public.funeral_policies FOR ALL
  TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER funeral_policies_updated_at
  BEFORE UPDATE ON public.funeral_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_funeral_leads_status ON public.funeral_leads(status);
CREATE INDEX idx_funeral_leads_user ON public.funeral_leads(user_id);
CREATE INDEX idx_funeral_policies_user ON public.funeral_policies(user_id);
CREATE INDEX idx_funeral_policies_status ON public.funeral_policies(status);
