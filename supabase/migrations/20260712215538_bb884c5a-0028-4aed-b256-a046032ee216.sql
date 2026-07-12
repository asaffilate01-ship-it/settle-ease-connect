
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS product_line text,
  ADD COLUMN IF NOT EXISTS preferred_contact text,
  ADD COLUMN IF NOT EXISTS carrier_partner text,
  ADD COLUMN IF NOT EXISTS commission_pct numeric;

ALTER TABLE public.insurance_leads
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN benefit_amount DROP NOT NULL,
  ALTER COLUMN tobacco DROP NOT NULL,
  ALTER COLUMN waiting_period_months DROP NOT NULL,
  ALTER COLUMN estimated_premium_min DROP NOT NULL,
  ALTER COLUMN estimated_premium_max DROP NOT NULL;

-- Allow public (unauthenticated) submissions of callback requests.
DROP POLICY IF EXISTS "public can submit insurance leads" ON public.insurance_leads;
CREATE POLICY "public can submit insurance leads"
  ON public.insurance_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.insurance_leads TO anon;
