
-- 1. Embassies / consulates directory
CREATE TABLE public.embassies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  country_code text NOT NULL,
  mission_type text NOT NULL DEFAULT 'embassy', -- embassy | consulate_general | honorary_consulate
  city text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  visa_services text[],
  opening_hours text,
  emergency_phone text,
  languages text[] DEFAULT ARRAY['en'],
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.embassies TO authenticated;
GRANT ALL ON public.embassies TO service_role;
ALTER TABLE public.embassies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read embassies" ON public.embassies FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "internal manage embassies" ON public.embassies FOR ALL TO authenticated
  USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));
CREATE TRIGGER trg_embassies_updated BEFORE UPDATE ON public.embassies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Family members / dependants
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship text NOT NULL, -- spouse | partner | child | parent | sibling | other
  full_name text NOT NULL,
  date_of_birth date,
  nationality text,
  residency_status text, -- eu_citizen | permanent_resident | temp_resident | pending | non_resident
  passport_number text,
  arrival_date date,
  added_to_health_insurance_id uuid REFERENCES public.health_insurance(id) ON DELETE SET NULL,
  covered_by_subscription boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or internal read family" ON public.family_members FOR SELECT TO authenticated
  USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE POLICY "own or internal write family" ON public.family_members FOR ALL TO authenticated
  USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()))
  WITH CHECK (auth.uid() = client_user_id OR public.is_internal(auth.uid()));
CREATE TRIGGER trg_family_updated BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Emergency ordering on trusted_contacts
ALTER TABLE public.trusted_contacts ADD COLUMN IF NOT EXISTS emergency_order int;
CREATE UNIQUE INDEX IF NOT EXISTS trusted_contacts_emergency_order_unique
  ON public.trusted_contacts (client_user_id, emergency_order)
  WHERE emergency_order IS NOT NULL;

-- 4. Emergency alerts raised by nominated contacts
CREATE TABLE public.emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raised_by_contact_id uuid REFERENCES public.trusted_contacts(id) ON DELETE SET NULL,
  raised_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL, -- deceased | hospitalised | missing | crisis | unable_to_contact | other
  description text,
  status text NOT NULL DEFAULT 'open', -- open | acknowledged | resolved
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.emergency_alerts TO authenticated;
GRANT ALL ON public.emergency_alerts TO service_role;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Owner (the client) can read alerts about themselves; internal staff can read all
CREATE POLICY "own or internal read alerts" ON public.emergency_alerts FOR SELECT TO authenticated
  USING (auth.uid() = client_user_id OR public.is_internal(auth.uid()));

-- Anyone signed-in listed as one of the client's trusted_contacts by matching email can raise an alert.
-- Also internal staff and the client themselves can raise.
CREATE POLICY "nominated or internal raise alert" ON public.emergency_alerts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_internal(auth.uid())
    OR auth.uid() = client_user_id
    OR EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      JOIN auth.users u ON lower(u.email) = lower(tc.email)
      WHERE tc.client_user_id = emergency_alerts.client_user_id
        AND u.id = auth.uid()
        AND tc.emergency_order IS NOT NULL
    )
  );

CREATE POLICY "internal update alerts" ON public.emergency_alerts FOR UPDATE TO authenticated
  USING (public.is_internal(auth.uid())) WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER trg_alerts_updated BEFORE UPDATE ON public.emergency_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed a starter set of missions in Berlin + major consulates
INSERT INTO public.embassies (country, country_code, mission_type, city, address, phone, email, website, visa_services, languages) VALUES
('United Kingdom','GB','embassy','Berlin','Wilhelmstraße 70-71, 10117 Berlin','+49 30 204570','info@britischebotschaft.de','https://www.gov.uk/world/germany',ARRAY['consular','passport','emergency_travel'],ARRAY['en','de']),
('United States','US','embassy','Berlin','Pariser Platz 2, 10117 Berlin','+49 30 83050','ConsBerlin@state.gov','https://de.usembassy.gov',ARRAY['visa','passport','notary','emergency'],ARRAY['en','de']),
('Ireland','IE','embassy','Berlin','Jägerstraße 51, 10117 Berlin','+49 30 220720','berlinembassy@dfa.ie','https://www.ireland.ie/de',ARRAY['passport','emergency','consular'],ARRAY['en','de','ga']),
('France','FR','embassy','Berlin','Pariser Platz 5, 10117 Berlin','+49 30 590039000','info@ambafrance-de.org','https://de.ambafrance.org',ARRAY['visa','passport','consular'],ARRAY['fr','de']),
('Italy','IT','embassy','Berlin','Hiroshimastraße 1, 10785 Berlin','+49 30 254400','ambasciata.berlino@esteri.it','https://ambberlino.esteri.it',ARRAY['visa','passport','consular'],ARRAY['it','de']),
('Spain','ES','embassy','Berlin','Lichtensteinallee 1, 10787 Berlin','+49 30 2540070','emb.berlin@maec.es','https://www.exteriores.gob.es/embajadas/berlin',ARRAY['visa','passport','consular'],ARRAY['es','de']),
('Portugal','PT','embassy','Berlin','Zimmerstraße 56, 10117 Berlin','+49 30 5900635000','berlim@mne.pt','https://berlim.embaixadaportugal.mne.gov.pt',ARRAY['visa','passport','consular'],ARRAY['pt','de']),
('Netherlands','NL','embassy','Berlin','Klosterstraße 50, 10179 Berlin','+49 30 209560','ber@minbuza.nl','https://www.niederlandeweltweit.nl',ARRAY['visa','passport','consular'],ARRAY['nl','en','de']),
('Belgium','BE','embassy','Berlin','Jägerstraße 52-53, 10117 Berlin','+49 30 2064200','berlin@diplobel.fed.be','https://germany.diplomatie.belgium.be',ARRAY['visa','consular'],ARRAY['nl','fr','de']),
('Poland','PL','embassy','Berlin','Lassenstraße 19-21, 14193 Berlin','+49 30 223130','berlin.amb.sekretariat@msz.gov.pl','https://www.gov.pl/berlin',ARRAY['visa','passport','consular'],ARRAY['pl','de']),
('Ukraine','UA','embassy','Berlin','Albrechtstraße 26, 10117 Berlin','+49 30 288870','emb_de@mfa.gov.ua','https://germany.mfa.gov.ua',ARRAY['passport','consular','emergency'],ARRAY['uk','de']),
('Russia','RU','embassy','Berlin','Unter den Linden 63-65, 10117 Berlin','+49 30 22651183','info@russische-botschaft.de','https://germany.mid.ru',ARRAY['visa','passport'],ARRAY['ru','de']),
('Turkey','TR','embassy','Berlin','Tiergartenstraße 19-21, 10785 Berlin','+49 30 27585-0','info@botschaft-tuerkei.de','https://berlin.be.mfa.gov.tr',ARRAY['passport','consular'],ARRAY['tr','de']),
('India','IN','embassy','Berlin','Tiergartenstraße 17, 10785 Berlin','+49 30 25795-0','amb.berlin@mea.gov.in','https://www.indianembassyberlin.gov.in',ARRAY['visa','passport','consular','oci'],ARRAY['en','hi','de']),
('Pakistan','PK','embassy','Berlin','Schaperstraße 29, 10719 Berlin','+49 30 2124400','parepberlin@t-online.de','https://www.pakemb.de',ARRAY['visa','passport','consular','nicop'],ARRAY['ur','en','de']),
('Bangladesh','BD','embassy','Berlin','Kaiserin-Augusta-Straße 71, 12103 Berlin','+49 30 3989750','info@bdembassyberlin.de','https://berlin.mofa.gov.bd',ARRAY['visa','passport','consular'],ARRAY['bn','en','de']),
('Iran','IR','embassy','Berlin','Podbielskiallee 65-67, 14195 Berlin','+49 30 8435350','info@iranembassy.de','https://berlin.mfa.gov.ir',ARRAY['passport','consular'],ARRAY['fa','de']),
('Iraq','IQ','embassy','Berlin','Riemeisterstraße 20, 14169 Berlin','+49 30 814880','info@iraqiembassy-berlin.de','https://www.iraqiembassy-berlin.de',ARRAY['visa','passport','consular'],ARRAY['ar','ku','de']),
('Syria','SY','embassy','Berlin','Rauchstraße 25, 10787 Berlin','+49 30 501770','embassy.berlin@mopa.gov.sy',NULL,ARRAY['passport','consular'],ARRAY['ar','de']),
('Afghanistan','AF','embassy','Berlin','Taunusstraße 3, 14193 Berlin','+49 30 20674920','info@botschaftafghanistan.de','https://afghanembassy.de',ARRAY['passport','consular'],ARRAY['fa','ps','de']),
('China','CN','embassy','Berlin','Märkisches Ufer 54, 10179 Berlin','+49 30 27588-0','de@mfa.gov.cn','http://de.china-embassy.gov.cn',ARRAY['visa','passport','consular'],ARRAY['zh','de']),
('Japan','JP','embassy','Berlin','Hiroshimastraße 6, 10785 Berlin','+49 30 210940','info@bo.mofa.go.jp','https://www.de.emb-japan.go.jp',ARRAY['visa','passport','consular'],ARRAY['ja','de','en']),
('South Korea','KR','embassy','Berlin','Stülerstraße 8-10, 10787 Berlin','+49 30 260650','koremb-ge@mofa.or.kr','https://overseas.mofa.go.kr/de-de',ARRAY['visa','passport','consular'],ARRAY['ko','de','en']),
('Vietnam','VN','embassy','Berlin','Elsenstraße 3, 12435 Berlin','+49 30 53630108','info@vietnambotschaft.org','https://vietnambotschaft.org',ARRAY['visa','passport','consular'],ARRAY['vi','de']),
('Philippines','PH','embassy','Berlin','Luisenstraße 16, 10117 Berlin','+49 30 864950','berlin.pe@dfa.gov.ph','https://berlinpe.dfa.gov.ph',ARRAY['visa','passport','consular'],ARRAY['en','fil','de']),
('Thailand','TH','embassy','Berlin','Lepsiusstraße 64-66, 12163 Berlin','+49 30 794810','general@thaiembassy.de','https://berlin.thaiembassy.org',ARRAY['visa','passport','consular'],ARRAY['th','de','en']),
('Indonesia','ID','embassy','Berlin','Lehrter Straße 16-17, 10557 Berlin','+49 30 4780700','info@botschaft-indonesien.de','https://kemlu.go.id/berlin',ARRAY['visa','passport','consular'],ARRAY['id','de','en']),
('Nigeria','NG','embassy','Berlin','Neue Jakobstraße 4, 10179 Berlin','+49 30 2123000','info@nigeriaembassygermany.org','https://nigeriaembassygermany.org',ARRAY['visa','passport','consular'],ARRAY['en','de']),
('Ghana','GH','embassy','Berlin','Stavangerstraße 17-19, 10439 Berlin','+49 30 5471490','info@ghana-embassy.de','https://www.ghana-embassy.de',ARRAY['visa','passport','consular'],ARRAY['en','de']),
('Kenya','KE','embassy','Berlin','Markgrafenstraße 63, 10969 Berlin','+49 30 2592660','office@embassy-of-kenya.de','https://www.embassy-of-kenya.de',ARRAY['visa','passport','consular'],ARRAY['en','sw','de']),
('South Africa','ZA','embassy','Berlin','Tiergartenstraße 18, 10785 Berlin','+49 30 220730','berlin.info@dirco.gov.za','https://www.suedafrika.org',ARRAY['visa','passport','consular'],ARRAY['en','de']),
('Morocco','MA','embassy','Berlin','Niederwallstraße 39, 10117 Berlin','+49 30 20612540','info@botschaft-marokko.de','https://www.botschaft-marokko.de',ARRAY['visa','passport','consular'],ARRAY['ar','fr','de']),
('Egypt','EG','embassy','Berlin','Stauffenbergstraße 6-7, 10785 Berlin','+49 30 4775470','embassy@egyptian-embassy.de','https://www.egyptian-embassy.de',ARRAY['visa','passport','consular'],ARRAY['ar','de']),
('Australia','AU','embassy','Berlin','Wallstraße 76-79, 10179 Berlin','+49 30 8800880','info.berlin@dfat.gov.au','https://germany.embassy.gov.au',ARRAY['passport','consular','emergency'],ARRAY['en','de']),
('Canada','CA','embassy','Berlin','Leipziger Platz 17, 10117 Berlin','+49 30 203120','brlin@international.gc.ca','https://www.canadainternational.gc.ca/germany-allemagne',ARRAY['passport','consular','emergency'],ARRAY['en','fr','de']),
('Brazil','BR','embassy','Berlin','Wallstraße 57, 10179 Berlin','+49 30 726280','brasemb.berlim@itamaraty.gov.br','https://berlim.itamaraty.gov.br',ARRAY['visa','passport','consular'],ARRAY['pt','de']),
('Mexico','MX','embassy','Berlin','Klingelhöferstraße 3, 10785 Berlin','+49 30 269323-0','info@botschaftmexiko.de','https://embamex.sre.gob.mx/alemania',ARRAY['visa','passport','consular'],ARRAY['es','de']),
('Argentina','AR','embassy','Berlin','Kleiststraße 23-26, 10787 Berlin','+49 30 226689-0','ealem@mrecic.gov.ar','https://ealem.cancilleria.gob.ar',ARRAY['visa','passport','consular'],ARRAY['es','de']),
('United Kingdom','GB','consulate_general','Düsseldorf','Willi-Becker-Allee 10, 40227 Düsseldorf','+49 211 94480','duesseldorf.consulate@fcdo.gov.uk','https://www.gov.uk/world/germany',ARRAY['passport','emergency_travel'],ARRAY['en','de']),
('United States','US','consulate_general','Frankfurt','Gießener Straße 30, 60435 Frankfurt am Main','+49 69 75350','ConsFrankfurt@state.gov','https://de.usembassy.gov',ARRAY['visa','passport','notary','emergency'],ARRAY['en','de']),
('United States','US','consulate_general','Munich','Königinstraße 5, 80539 München','+49 89 28880','ConsMunich@state.gov','https://de.usembassy.gov',ARRAY['passport','notary','emergency'],ARRAY['en','de']),
('Turkey','TR','consulate_general','Munich','Menzinger Straße 3, 80638 München','+49 89 178050','konsulat.muenchen@mfa.gov.tr','https://muenchen.bk.mfa.gov.tr',ARRAY['passport','consular'],ARRAY['tr','de']),
('India','IN','consulate_general','Frankfurt','Friedrich-Ebert-Anlage 26, 60325 Frankfurt am Main','+49 69 15300500','cons.frankfurt@mea.gov.in','https://www.cgifrankfurt.gov.in',ARRAY['visa','passport','consular','oci'],ARRAY['en','hi','de']),
('India','IN','consulate_general','Munich','Widenmayerstraße 15, 80538 München','+49 89 210239-0','cg.munich@mea.gov.in','https://www.cgimunich.gov.in',ARRAY['visa','passport','consular','oci'],ARRAY['en','hi','de']),
('Pakistan','PK','consulate_general','Frankfurt','Bettinastraße 60, 60325 Frankfurt am Main','+49 69 71673870','pcgfrankfurt@mofa.gov.pk',NULL,ARRAY['visa','passport','consular','nicop'],ARRAY['ur','en','de']);
