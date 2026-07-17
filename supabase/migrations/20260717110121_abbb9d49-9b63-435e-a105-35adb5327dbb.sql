
-- 1. TEMPLATES
CREATE TABLE public.checklist_templates (
  key text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checklist_templates TO authenticated;
GRANT ALL ON public.checklist_templates TO service_role;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read active checklist templates"
  ON public.checklist_templates FOR SELECT TO authenticated
  USING (active OR public.is_internal(auth.uid()));

CREATE POLICY "staff manage checklist templates"
  ON public.checklist_templates FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER trg_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ITEMS
CREATE TABLE public.checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL REFERENCES public.checklist_templates(key) ON DELETE CASCADE,
  item_key text NOT NULL,
  title text NOT NULL,
  note text,
  position int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_key, item_key)
);
CREATE INDEX idx_checklist_items_template ON public.checklist_template_items(template_key, position);
GRANT SELECT ON public.checklist_template_items TO authenticated;
GRANT ALL ON public.checklist_template_items TO service_role;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read checklist items"
  ON public.checklist_template_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.checklist_templates t
      WHERE t.key = checklist_template_items.template_key
        AND (t.active OR public.is_internal(auth.uid()))
    )
  );

CREATE POLICY "staff manage checklist items"
  ON public.checklist_template_items FOR ALL TO authenticated
  USING (public.is_internal(auth.uid()))
  WITH CHECK (public.is_internal(auth.uid()));

CREATE TRIGGER trg_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. SEED TEMPLATES
INSERT INTO public.checklist_templates (key, title, description, position) VALUES
('anmeldung', 'Address Registration (Anmeldung)', 'The single most important thing to do in your first 14 days.', 10),
('arrival', 'First 30 Days in Germany', 'Everything a new arrival must set up.', 20),
('student', 'Student Germany Pack', 'From admission to first semester.', 30),
('residence-permit', 'Residence Permit Timeline', 'Aufenthaltstitel from visa entry through renewal and Niederlassungserlaubnis.', 40),
('health-insurance', 'Health Insurance Comparison', 'Pick between statutory (GKV) and private/expat (PKV) — with the switch rules.', 50),
('bank-sim-utilities', 'Bank, SIM & Utility Setup', 'The first-week logistics: money, phone number, electricity, internet.', 60),
('translation', 'Document Translation', 'Beglaubigte Übersetzung for authorities — what needs it and who can do it.', 70),
('appointment-reminders', 'Appointment Reminders', 'Never miss a Termin — Bürgeramt, ABH, doctor, Jobcenter.', 80),
('housing-pack', 'Housing Application Pack', 'The bundle every landlord asks for — Mietschuldenfreiheitsbescheinigung and beyond.', 90),
('rundfunkbeitrag', 'Rundfunkbeitrag Guidance', 'The €18.36/month broadcasting fee — register, exempt or share.', 100),
('taxid-employment', 'Tax ID & Employment Onboarding', 'Steuer-ID, Sozialversicherung, Lohnsteuerklasse and first payslip check.', 110),
('driving-licence', 'Driving Licence Conversion', 'Umschreibung of your foreign Führerschein — deadlines, tests, translations.', 120),
('family-reunification', 'Family Reunification (Familiennachzug)', 'Bringing spouse and children to Germany — §§27–36 AufenthG.', 130);

-- 4. SEED ITEMS
INSERT INTO public.checklist_template_items (template_key, item_key, title, note, position) VALUES
-- anmeldung
('anmeldung','a1','Book Bürgeramt appointment online',NULL,10),
('anmeldung','a2','Landlord confirmation (Wohnungsgeberbestätigung)',NULL,20),
('anmeldung','a3','Passport + visa',NULL,30),
('anmeldung','a4','Rental contract copy',NULL,40),
('anmeldung','a5','Anmeldebestätigung received',NULL,50),
('anmeldung','a6','Tax ID (Steuer-ID) arrives by post within 2–3 weeks',NULL,60),
-- arrival
('arrival','b1','Address registration (Anmeldung)',NULL,10),
('arrival','b2','Open bank account (N26, DKB, Sparkasse)',NULL,20),
('arrival','b3','Health insurance (TK, AOK, Barmer)',NULL,30),
('arrival','b4','Residence permit appointment (Ausländerbehörde)',NULL,40),
('arrival','b5','SIM card & mobile contract',NULL,50),
('arrival','b6','Deutschlandticket / transport pass',NULL,60),
('arrival','b7','Find a Hausarzt (GP)',NULL,70),
('arrival','b8','School / Kita registration for children',NULL,80),
('arrival','b9','Utility & internet contracts',NULL,90),
-- student
('student','s1','University admission letter (Zulassungsbescheid)',NULL,10),
('student','s2','Blocked account (€11,904 / year)',NULL,20),
('student','s3','Student visa application',NULL,30),
('student','s4','Health insurance for students (~€130/month)',NULL,40),
('student','s5','Accommodation (Studentenwerk, WG)',NULL,50),
('student','s6','Anmeldung after arrival',NULL,60),
('student','s7','University enrolment (Immatrikulation)',NULL,70),
('student','s8','Residence permit for study',NULL,80),
('student','s9','Semester ticket & student ID',NULL,90),
-- residence-permit
('residence-permit','rp1','Book Ausländerbehörde Termin (2–6 week wait)','Berlin.de / abh.hamburg.de / termin.muenchen.de',10),
('residence-permit','rp2','Anmeldung complete before appointment',NULL,20),
('residence-permit','rp3','Biometric passport photo (35×45mm)',NULL,30),
('residence-permit','rp4','Proof of health insurance (statutory or expat)',NULL,40),
('residence-permit','rp5','Proof of purpose (contract, admission, marriage)',NULL,50),
('residence-permit','rp6','Proof of livelihood (payslips, Sperrkonto, sponsor)',NULL,60),
('residence-permit','rp7','Fiktionsbescheinigung if title expires before appointment',NULL,70),
('residence-permit','rp8','Renewal filed at least 8 weeks before expiry',NULL,80),
('residence-permit','rp9','Niederlassungserlaubnis eligibility (§9 AufenthG — usually 33/21 months Blue Card, 5y others)',NULL,90),
-- health-insurance
('health-insurance','hi1','Confirm employment status & gross salary vs JAEG (€73,800 in 2025)',NULL,10),
('health-insurance','hi2','Statutory shortlist: TK, AOK, Barmer, DAK, hkk',NULL,20),
('health-insurance','hi3','Private/expat shortlist: Feather, ottonova, DR-WALTER, Mawista (arrival window only)',NULL,30),
('health-insurance','hi4','Compare contribution + Zusatzbeitrag (avg 1.7%)',NULL,40),
('health-insurance','hi5','Compare dental, hospital, alternative medicine coverage',NULL,50),
('health-insurance','hi6','Check family co-insurance (Familienversicherung) — free in GKV',NULL,60),
('health-insurance','hi7','Submit Mitgliedsbescheinigung to employer / Ausländerbehörde',NULL,70),
('health-insurance','hi8','Set 18-month review reminder (statutory switch window)',NULL,80),
-- bank-sim-utilities
('bank-sim-utilities','bs1','Open a Girokonto (N26, DKB, Commerzbank, Sparkasse)','N26/DKB accept many without Anmeldung; Sparkasse usually requires it',10),
('bank-sim-utilities','bs2','Complete VideoIdent or Postident',NULL,20),
('bank-sim-utilities','bs3','Set up SEPA salary deposit + rent standing order',NULL,30),
('bank-sim-utilities','bs4','Prepaid SIM to bridge (Aldi Talk, Lidl Connect, congstar)',NULL,40),
('bank-sim-utilities','bs5','Long-term mobile contract after Anmeldung + SCHUFA',NULL,50),
('bank-sim-utilities','bs6','Electricity contract (Grundversorger auto-active; switch via Verivox/Check24)',NULL,60),
('bank-sim-utilities','bs7','Gas contract if applicable',NULL,70),
('bank-sim-utilities','bs8','Internet: DSL/fibre 24-month contract (Telekom, Vodafone, 1&1, o2)',NULL,80),
('bank-sim-utilities','bs9','Deutsche Post Nachsendeauftrag if moving in-country',NULL,90),
-- translation
('translation','tr1','List documents needing certified translation (birth, marriage, diplomas, driving licence)',NULL,10),
('translation','tr2','Apostille / legalisation from home country if required',NULL,20),
('translation','tr3','Find beeidigter Übersetzer (justiz-dolmetscher.de)',NULL,30),
('translation','tr4','Request quote + turnaround (typical 3–7 days, €40–80/page)',NULL,40),
('translation','tr5','Provide clear scans + originals for stamp',NULL,50),
('translation','tr6','Store translations in vault with expiry notes',NULL,60),
('translation','tr7','Anerkennung in Deutschland check for professional qualifications',NULL,70),
-- appointment-reminders
('appointment-reminders','ar1','Enable push notifications in the app',NULL,10),
('appointment-reminders','ar2','Sync ICS calendar feed to Google / Apple Calendar',NULL,20),
('appointment-reminders','ar3','Add Bürgeramt appointments with 24h + 2h reminders',NULL,30),
('appointment-reminders','ar4','Add Ausländerbehörde appointments',NULL,40),
('appointment-reminders','ar5','Add Krankenkasse / Facharzt appointments',NULL,50),
('appointment-reminders','ar6','Add Jobcenter / Agentur für Arbeit Termine',NULL,60),
('appointment-reminders','ar7','Weekly review of upcoming deadlines with case manager',NULL,70),
-- housing-pack
('housing-pack','hp1','SCHUFA-BonitätsAuskunft (€29.95) for landlords',NULL,10),
('housing-pack','hp2','Last 3 payslips (Gehaltsabrechnungen)',NULL,20),
('housing-pack','hp3','Employment contract (Arbeitsvertrag)',NULL,30),
('housing-pack','hp4','Passport / Aufenthaltstitel copy',NULL,40),
('housing-pack','hp5','Mietschuldenfreiheitsbescheinigung from previous landlord',NULL,50),
('housing-pack','hp6','Selbstauskunft form (tenant self-disclosure)',NULL,60),
('housing-pack','hp7','WBS application if eligible — see /app/benefits',NULL,70),
('housing-pack','hp8','Kaution: 3 cold-rent months escrow or Kautionsbürgschaft',NULL,80),
('housing-pack','hp9','Übergabeprotokoll on move-in — photos + meter readings',NULL,90),
-- rundfunkbeitrag
('rundfunkbeitrag','rb1','Register household within 4 weeks of Anmeldung (rundfunkbeitrag.de)',NULL,10),
('rundfunkbeitrag','rb2','One fee per household, not per person',NULL,20),
('rundfunkbeitrag','rb3','Check exemption — Bürgergeld, BAföG, disability GdB 80+',NULL,30),
('rundfunkbeitrag','rb4','Submit Befreiungsantrag with proof if exempt',NULL,40),
('rundfunkbeitrag','rb5','Deregister when moving abroad (Abmeldung ans Beitragsservice)',NULL,50),
('rundfunkbeitrag','rb6','Set quarterly payment or SEPA direct debit',NULL,60),
-- taxid-employment
('taxid-employment','te1','Steuer-ID arrives 2–3 weeks after Anmeldung','Reprint via Finanzamt if lost',10),
('taxid-employment','te2','Sozialversicherungsnummer (from first employer or DRV)',NULL,20),
('taxid-employment','te3','Choose Lohnsteuerklasse (I single, III/V or IV/IV for married)',NULL,30),
('taxid-employment','te4','Provide bank IBAN + Krankenkasse to HR',NULL,40),
('taxid-employment','te5','Sign Arbeitsvertrag + Probezeit terms',NULL,50),
('taxid-employment','te6','First payslip check: tax class, church tax, pension deduction',NULL,60),
('taxid-employment','te7','ELSTER account for annual Steuererklärung',NULL,70),
('taxid-employment','te8','Add employer to trusted contacts for Bescheinigungen',NULL,80),
-- driving-licence
('driving-licence','dl1','Confirm home country class (EU/EEA vs third-country Anlage 11)',NULL,10),
('driving-licence','dl2','EU/EEA: valid until expiry; Umtausch by 19 Jan 2033',NULL,20),
('driving-licence','dl3','Third-country: convert within 6 months of Anmeldung',NULL,30),
('driving-licence','dl4','Beglaubigte Übersetzung of licence (ADAC or sworn translator)',NULL,40),
('driving-licence','dl5','Sehtest (eye test) at optician (~€7)',NULL,50),
('driving-licence','dl6','Erste-Hilfe-Kurs (9 hours)',NULL,60),
('driving-licence','dl7','Book theory + practical test at Fahrschule if required',NULL,70),
('driving-licence','dl8','Submit Antrag at Führerscheinstelle',NULL,80),
-- family-reunification
('family-reunification','fr1','Confirm sponsor status: Blue Card, Niederlassung, work permit, refugee',NULL,10),
('family-reunification','fr2','Adequate housing proof (Wohnraum ~12 m² per person over 6)',NULL,20),
('family-reunification','fr3','Livelihood proof (3 months payslips + employment contract)',NULL,30),
('family-reunification','fr4','Spouse A1 German (exemptions for Blue Card, researchers)',NULL,40),
('family-reunification','fr5','Marriage certificate — apostille + certified translation',NULL,50),
('family-reunification','fr6','Children under 16: no language requirement; 16–17: C1 or integration prognosis',NULL,60),
('family-reunification','fr7','National visa (D) at German mission abroad (Vorabzustimmung speeds it up)',NULL,70),
('family-reunification','fr8','Ausländerbehörde Vorabzustimmung — 4–6 weeks',NULL,80),
('family-reunification','fr9','On arrival: Anmeldung → residence permit → language course',NULL,90);
