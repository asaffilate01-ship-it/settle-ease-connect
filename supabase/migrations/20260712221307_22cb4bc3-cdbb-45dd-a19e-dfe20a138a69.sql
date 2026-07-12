
CREATE TABLE public.tax_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  tax_year INT NOT NULL,
  employment_status TEXT NOT NULL,
  gross_income_eur NUMERIC(12,2),
  tax_class INT,
  church_tax BOOLEAN NOT NULL DEFAULT FALSE,
  has_children BOOLEAN NOT NULL DEFAULT FALSE,
  children_count INT NOT NULL DEFAULT 0,
  commute_km NUMERIC(6,2),
  home_office_days INT,
  additional_deductions NUMERIC(12,2),
  estimated_refund_eur NUMERIC(12,2),
  preferred_language TEXT NOT NULL DEFAULT 'de',
  preferred_contact TEXT NOT NULL DEFAULT 'email',
  partner_referral TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'tax_landing',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_leads TO authenticated;
GRANT INSERT ON public.tax_leads TO anon;
GRANT ALL ON public.tax_leads TO service_role;

ALTER TABLE public.tax_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) may create a tax lead from the public /tax landing.
CREATE POLICY "anyone can submit a tax lead"
  ON public.tax_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- The submitter can read their own lead (if signed in) or an internal team member.
CREATE POLICY "owners and internal can read tax leads"
  ON public.tax_leads FOR SELECT
  TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR public.is_internal(auth.uid())
  );

-- Internal team members can update / triage.
CREATE POLICY "internal can update tax leads"
  ON public.tax_leads FOR UPDATE
  TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE POLICY "internal can delete tax leads"
  ON public.tax_leads FOR DELETE
  TO authenticated
  USING (public.is_internal(auth.uid()));

CREATE TRIGGER update_tax_leads_updated_at
  BEFORE UPDATE ON public.tax_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
