-- Expert onboarding: invitations + payout ledger

-- 1. Invitations table (token-based email invites)
CREATE TABLE public.expert_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  compensation_model public.compensation_model NOT NULL DEFAULT 'referral_fee',
  referral_fee_pct NUMERIC,
  wholesale_rate_eur NUMERIC,
  hourly_rate_eur NUMERIC,
  languages TEXT[] NOT NULL DEFAULT ARRAY['de','en']::TEXT[],
  city TEXT,
  bundesland TEXT,
  personal_message TEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_invitations TO authenticated;
GRANT ALL ON public.expert_invitations TO service_role;

ALTER TABLE public.expert_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff manage expert invitations"
  ON public.expert_invitations FOR ALL
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Invitee can read own invitation by token via server fn"
  ON public.expert_invitations FOR SELECT
  USING (accepted_by = auth.uid());

CREATE INDEX idx_expert_invitations_email ON public.expert_invitations (lower(email));
CREATE INDEX idx_expert_invitations_token ON public.expert_invitations (token) WHERE accepted_at IS NULL;

CREATE TRIGGER trg_expert_invitations_updated_at
  BEFORE UPDATE ON public.expert_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Payout ledger — one row per earned amount, aggregated to periods
CREATE TABLE public.expert_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.case_invoices(id) ON DELETE SET NULL,
  period_month DATE NOT NULL DEFAULT (date_trunc('month', now()))::date,
  kind TEXT NOT NULL CHECK (kind IN ('referral_fee','wholesale_markup','hourly','bonus','adjustment')),
  description TEXT,
  gross_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate NUMERIC(6,4),
  amount_eur NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','void')),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_payouts TO authenticated;
GRANT ALL ON public.expert_payouts TO service_role;

ALTER TABLE public.expert_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff manage expert payouts"
  ON public.expert_payouts FOR ALL
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "Experts can read their own payouts"
  ON public.expert_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.experts e
      WHERE e.id = expert_payouts.expert_id
        AND e.user_id = auth.uid()
    )
  );

CREATE INDEX idx_expert_payouts_expert_period ON public.expert_payouts (expert_id, period_month DESC);
CREATE INDEX idx_expert_payouts_status ON public.expert_payouts (status) WHERE status IN ('pending','approved');

CREATE TRIGGER trg_expert_payouts_updated_at
  BEFORE UPDATE ON public.expert_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Notify onboarding: when an invitation is accepted, promote the user to 'expert' role
CREATE OR REPLACE FUNCTION public.accept_expert_invitation(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  new_expert_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO inv
    FROM public.expert_invitations
   WHERE token = _token
     AND accepted_at IS NULL
     AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found or expired';
  END IF;

  -- Create expert row linked to this user
  INSERT INTO public.experts (
    user_id, full_name, email, profession, compensation_model,
    referral_fee_pct, wholesale_rate_eur, hourly_rate_eur,
    languages, city, bundesland, status, verified
  ) VALUES (
    auth.uid(), inv.full_name, inv.email, inv.profession, inv.compensation_model,
    inv.referral_fee_pct, inv.wholesale_rate_eur, inv.hourly_rate_eur,
    inv.languages, inv.city, inv.bundesland, 'active', TRUE
  )
  RETURNING id INTO new_expert_id;

  -- Grant expert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'expert')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark invitation accepted
  UPDATE public.expert_invitations
     SET accepted_at = now(),
         accepted_by = auth.uid(),
         created_expert_id = new_expert_id
   WHERE id = inv.id;

  RETURN new_expert_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_expert_invitation(TEXT) TO authenticated;