
-- ============= AGENT PORTAL TABLES =============

CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own row" ON public.agents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_internal(auth.uid()));

CREATE POLICY "Admins manage agents" ON public.agents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents update own profile" ON public.agents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= AGENT REFERRALS =============

CREATE TABLE public.agent_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email TEXT,
  source TEXT NOT NULL DEFAULT 'link',
  product TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_referrals TO authenticated;
GRANT ALL ON public.agent_referrals TO service_role;
ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own referrals" ON public.agent_referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = agent_user_id OR public.is_internal(auth.uid()));

CREATE POLICY "Admins manage referrals" ON public.agent_referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER agent_referrals_updated_at BEFORE UPDATE ON public.agent_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= AGENT COMMISSIONS =============

CREATE TABLE public.agent_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  period_month DATE NOT NULL,
  product TEXT NOT NULL DEFAULT 'subscription',
  gross_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  commission_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_commissions TO authenticated;
GRANT ALL ON public.agent_commissions TO service_role;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own commissions" ON public.agent_commissions
  FOR SELECT TO authenticated
  USING (auth.uid() = agent_user_id OR public.is_internal(auth.uid()));

CREATE POLICY "Admins manage commissions" ON public.agent_commissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER agent_commissions_updated_at BEFORE UPDATE ON public.agent_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= ATTRIBUTION COLUMNS =============

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS referring_agent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS referring_agent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============= is_agent() HELPER =============

CREATE OR REPLACE FUNCTION public.is_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'agent'
  )
$$;
