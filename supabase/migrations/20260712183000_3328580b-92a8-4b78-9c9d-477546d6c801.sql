
-- Life admin tables
CREATE TABLE public.employment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer text NOT NULL,
  role text,
  contract_type text,
  tax_class text,
  gross_salary_cents bigint,
  currency text DEFAULT 'EUR',
  start_date date,
  end_date date,
  hr_contact_name text,
  hr_contact_email text,
  hr_contact_phone text,
  works_council text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment_records TO authenticated;
GRANT ALL ON public.employment_records TO service_role;
ALTER TABLE public.employment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read employment" ON public.employment_records FOR SELECT TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write employment" ON public.employment_records FOR ALL TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid())) WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE TRIGGER trg_employment_updated BEFORE UPDATE ON public.employment_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, -- statutory | occupational | riester | ruerup | private
  provider text NOT NULL,
  policy_number text,
  monthly_contribution_cents bigint,
  currency text DEFAULT 'EUR',
  start_date date,
  projected_monthly_payout_cents bigint,
  beneficiary_name text,
  beneficiary_relationship text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pensions TO authenticated;
GRANT ALL ON public.pensions TO service_role;
ALTER TABLE public.pensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read pensions" ON public.pensions FOR SELECT TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write pensions" ON public.pensions FOR ALL TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid())) WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE TRIGGER trg_pensions_updated BEFORE UPDATE ON public.pensions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.health_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, -- gkv | pkv | private_top_up
  kasse text NOT NULL,
  membership_number text,
  tariff text,
  monthly_premium_cents bigint,
  dependants_covered int DEFAULT 0,
  addons jsonb DEFAULT '[]'::jsonb,
  start_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_insurance TO authenticated;
GRANT ALL ON public.health_insurance TO service_role;
ALTER TABLE public.health_insurance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read health" ON public.health_insurance FOR SELECT TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write health" ON public.health_insurance FOR ALL TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid())) WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE TRIGGER trg_health_updated BEFORE UPDATE ON public.health_insurance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL, -- next_of_kin, medical_proxy, executor, employer_hr, gp, lawyer, accountant, embassy, other
  name text NOT NULL,
  phone text,
  email text,
  address text,
  language text,
  notes text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trusted_contacts TO authenticated;
GRANT ALL ON public.trusted_contacts TO service_role;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read contacts" ON public.trusted_contacts FOR SELECT TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write contacts" ON public.trusted_contacts FOR ALL TO authenticated USING (auth.uid() = client_user_id OR public.is_internal(auth.uid())) WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.trusted_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Referral engine
CREATE TABLE public.referral_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL, -- insurer_health, insurer_life, insurer_disability, insurer_liability, insurer_household, insurer_car, insurer_travel, lawyer, notary, tax_advisor, accountant, mover, airline, travel, fx, language_school, driving_school, real_estate, utilities, telecom, other
  description text,
  countries text[] DEFAULT ARRAY['DE'],
  languages text[] DEFAULT ARRAY['de','en'],
  contact_email text,
  contact_phone text,
  website text,
  url_template text NOT NULL, -- may include {ref} {sub}
  commission_model text NOT NULL, -- flat | percent_first | percent_recurring | cpl | cpa
  commission_rate numeric(10,4) DEFAULT 0,
  commission_flat_cents bigint DEFAULT 0,
  currency text DEFAULT 'EUR',
  payout_terms text,
  disclose_to_client boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_partners TO service_role;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read partners" ON public.referral_partners FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "internal manage partners" ON public.referral_partners FOR ALL TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.referral_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.referral_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.referral_partners(id) ON DELETE RESTRICT,
  client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  case_id uuid,
  source_page text,
  status text NOT NULL DEFAULT 'sent', -- sent | clicked | registered | converted | paid | clawback | rejected
  commission_expected_cents bigint DEFAULT 0,
  commission_received_cents bigint DEFAULT 0,
  currency text DEFAULT 'EUR',
  invoice_reference text,
  notes text,
  converted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.referral_leads TO authenticated;
GRANT ALL ON public.referral_leads TO service_role;
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal read leads" ON public.referral_leads FOR SELECT TO authenticated USING (public.is_internal(auth.uid()) OR auth.uid() = client_user_id);
CREATE POLICY "auth insert own lead" ON public.referral_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "internal update leads" ON public.referral_leads FOR UPDATE TO authenticated USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.referral_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a starter partner catalog
INSERT INTO public.referral_partners (slug, name, category, description, url_template, commission_model, commission_rate, disclose_to_client) VALUES
('techniker-krankenkasse','Techniker Krankenkasse','insurer_health','Largest statutory health insurer in Germany.','https://www.tk.de/en?ref={ref}&sub={sub}','cpa',0,true),
('aok','AOK','insurer_health','Regional statutory health insurance.','https://www.aok.de/pk?ref={ref}&sub={sub}','cpa',0,true),
('ottonova','ottonova','insurer_health','Digital private health insurance (PKV).','https://www.ottonova.de?ref={ref}&sub={sub}','percent_first',0.35,false),
('allianz-life','Allianz Leben','insurer_life','Term life & risk life insurance.','https://www.allianz.de/leben?ref={ref}&sub={sub}','percent_first',0.30,false),
('getsurance','Getsurance','insurer_disability','Online disability (BU) insurance.','https://getsurance.de?ref={ref}&sub={sub}','percent_first',0.40,false),
('haftpflichtkasse','Haftpflichtkasse','insurer_liability','Personal liability insurance.','https://www.haftpflichtkasse.de?ref={ref}&sub={sub}','percent_first',0.25,false),
('feather','Feather Insurance','insurer_household','English-speaking broker (contents, liability, life).','https://feather-insurance.com?ref={ref}&sub={sub}','cpl',0,false),
('check24','CHECK24','insurer_car','Compare car insurance quotes.','https://www.check24.de/kfz?ref={ref}&sub={sub}','cpa',0,false),
('hanse-merkur-travel','HanseMerkur Travel','insurer_travel','Travel health insurance.','https://www.hansemerkur.de/reise?ref={ref}&sub={sub}','percent_first',0.20,false),
('sorted','Sorted Tax','tax_advisor','Freelancer tax filing (English).','https://sorted.eu?ref={ref}&sub={sub}','cpa',0,false),
('accountable','Accountable','tax_advisor','Freelancer bookkeeping & tax app.','https://accountable.eu?ref={ref}&sub={sub}','cpa',0,false),
('wundertax','wundertax','tax_advisor','DIY tax return in English.','https://www.wundertax.de?ref={ref}&sub={sub}','cpa',0,true),
('lawyered-de','Lawyered.de','lawyer','English-speaking German lawyers marketplace.','https://lawyered.de?ref={ref}&sub={sub}','cpl',0,false),
('notarnet','NotarNet','notary','Find a notary near you.','https://www.notar.de?ref={ref}&sub={sub}','cpl',0,true),
('movinga','Movinga','mover','Nationwide moving company.','https://www.movinga.de?ref={ref}&sub={sub}','percent_first',0.10,false),
('sirelo','Sirelo','mover','Compare international movers.','https://www.sirelo.com?ref={ref}&sub={sub}','cpl',0,false),
('lufthansa','Lufthansa','airline','Flight bookings.','https://www.lufthansa.com?ref={ref}&sub={sub}','percent_first',0.02,true),
('kiwi','Kiwi.com','travel','Flight & multi-stop bookings.','https://www.kiwi.com?ref={ref}&sub={sub}','percent_first',0.03,false),
('wise','Wise','fx','International money transfer.','https://wise.com?ref={ref}&sub={sub}','cpa',0,true),
('lingoda','Lingoda','language_school','Online German classes.','https://www.lingoda.com?ref={ref}&sub={sub}','percent_first',0.15,false),
('drivenow-school','Drive Now Fahrschule','driving_school','German driving licence conversion.','https://drivenow-fahrschule.de?ref={ref}&sub={sub}','cpl',0,false),
('immoscout','ImmobilienScout24','real_estate','Apartment search Germany.','https://www.immobilienscout24.de?ref={ref}&sub={sub}','cpl',0,true),
('verivox','Verivox','utilities','Electricity & gas provider comparison.','https://www.verivox.de?ref={ref}&sub={sub}','cpa',0,false),
('o2','o2 Telefónica','telecom','Mobile & broadband plans.','https://www.o2online.de?ref={ref}&sub={sub}','cpa',0,false);
