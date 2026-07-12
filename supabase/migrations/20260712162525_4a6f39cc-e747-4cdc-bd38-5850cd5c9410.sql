CREATE TABLE public.insurance_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  age int NOT NULL,
  benefit_amount int NOT NULL DEFAULT 10000,
  tobacco boolean NOT NULL DEFAULT false,
  waiting_period_months int NOT NULL DEFAULT 0,
  estimated_premium_min numeric(8,2),
  estimated_premium_max numeric(8,2),
  preferred_language text DEFAULT 'de',
  notes text,
  status text NOT NULL DEFAULT 'new',
  source text DEFAULT 'quote_widget',
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.insurance_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.insurance_leads TO authenticated;
GRANT ALL ON public.insurance_leads TO service_role;

ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an insurance lead"
  ON public.insurance_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Internal staff can view leads"
  ON public.insurance_leads FOR SELECT
  TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE POLICY "Internal staff can update leads"
  ON public.insurance_leads FOR UPDATE
  TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER insurance_leads_updated_at
  BEFORE UPDATE ON public.insurance_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();