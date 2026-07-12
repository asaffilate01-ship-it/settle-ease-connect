
DO $do$
DECLARE
  cat_reg uuid := (SELECT id FROM public.knowledge_categories WHERE slug='registration');
  cat_ss  uuid := (SELECT id FROM public.knowledge_categories WHERE slug='social-security');
BEGIN

INSERT INTO public.knowledge_services (slug, category_id, name, short_description, eligibility, legal_basis, jurisdiction_notes, typical_timeline, official_fees, fees_detail, where_to_apply, delivery_playbook, required_documents, forms, online_portals, common_pitfalls, appeals_process, tips, requires_expert_role, status) VALUES
('anmeldung', cat_reg, 'Anmeldung — Residence registration',
 'Register a new address at the Bürgeramt within 14 days of moving in. Prerequisite for almost every other German service (tax ID, bank, insurance, Aufenthaltstitel).',
 'Anyone moving into a German dwelling for >3 months.',
 'Bundesmeldegesetz (BMG) §17 — 14-day deadline.',
 'Wait times & booking systems vary heavily by city: Berlin (service.berlin.de), München (muenchen.de/rathaus), Hamburg (serviceportal.hamburg.de). Rural Bürgerämter often walk-in.',
 'Same day at appointment; Steuer-ID posted 2–4 weeks later.',
 'Free',
 'No fee for the registration itself. Fee only for extra Meldebescheinigung (€5–€12).',
 'Bürgeramt / Einwohnermeldeamt of the district you moved into.',
 jsonb_build_array(
   'Book an appointment on the city portal — release cycles vary; refresh at 07:00 & 12:00',
   'Ask landlord for signed Wohnungsgeberbestätigung (must include move-in date & full address)',
   'Attend appointment with tenant + all household members (children need birth certificates)',
   'Present passport/ID and rental contract as backup',
   'Collect Meldebescheinigung; Steuer-ID arrives by post within 2–4 weeks to the new address',
   'Trigger downstream updates: bank, employer, insurance, Ausländerbehörde, Rundfunkbeitrag'),
 jsonb_build_array(
   'Passport or national ID (for every person registering)',
   'Wohnungsgeberbestätigung signed by landlord (§19 BMG)',
   'Rental contract (backup)',
   'Marriage certificate + apostille/translation (if registering spouse)',
   'Birth certificates + translations (for children)',
   'Existing Meldebescheinigung if moving within Germany'),
 jsonb_build_array(
   jsonb_build_object('name','Anmeldung bei einer Meldebehörde','who','Applicant (main tenant fills for household)','notes','City-specific PDF; some cities allow on-the-spot completion at the counter'),
   jsonb_build_object('name','Wohnungsgeberbestätigung','who','Landlord / property owner','notes','Must include name & address of owner, move-in date, address, names of all occupants')),
 jsonb_build_array(
   jsonb_build_object('label','Berlin — Service Portal','url','https://service.berlin.de/dienstleistung/120686/'),
   jsonb_build_object('label','München — Anmeldung','url','https://www.muenchen.de/rathaus/dienstleistungsfinder/dienstleistung/e2edd7bcd10bfe9cf07c1e5eea63c8f6'),
   jsonb_build_object('label','Hamburg — Serviceportal','url','https://serviceportal.hamburg.de/HamburgGateway/Service/Entry/MRPORTAL01')),
 jsonb_build_array(
   'Missing Wohnungsgeberbestätigung — appointment refused; no proxy possible in most cities',
   '>14 days late → up to €1 000 Bußgeld (rarely enforced, but common on renewals)',
   'Untermieter often forget to bring the sub-let permission — Anmeldung rejected',
   'Foreign marriage/birth documents without apostille & sworn translation are refused'),
 'Formal Widerspruch to the Meldebehörde within 1 month if registration is refused. Escalate to Verwaltungsgericht if unresolved.',
 'Have the case manager pre-fill the form in the client''s language and attach a copy of the landlord''s ID scan — Berlin especially likes this.',
 'case_manager','active'),

('steuer-id', cat_reg, 'Steuer-Identifikationsnummer (Steuer-ID)',
 '11-digit lifelong tax ID issued by BZSt after first Anmeldung. Required by employers, banks, Kindergeld, benefits, insurance.',
 'Every person registered in Germany.',
 'AO §139b — Steueridentifikationsnummer.',
 'Federal, uniform across Bundesländer.',
 '2–4 weeks by post after Anmeldung; manual re-request 4–6 weeks.',
 'Free','Free. Third-party ''fast-track'' services are scams.',
 'Automatic after Anmeldung. If lost: BZSt online form or letter to Bundeszentralamt für Steuern, 53221 Bonn.',
 jsonb_build_array(
   'Confirm Anmeldung was completed and forwarded to BZSt',
   'Wait 4 weeks; check letterbox name-plate (post is often returned)',
   'If not received: submit BZSt online request or send letter with full name, DOB, address, Anmeldung date',
   'Alternative: request via employer / Krankenkasse (they can query for you)',
   'File in client vault; used on every future payroll & tax filing'),
 jsonb_build_array('Anmeldebestätigung (proof of registration)','Passport / ID','Any previous Steuer-ID letter'),
 jsonb_build_array(jsonb_build_object('name','Antrag auf Mitteilung der Steuer-ID','who','Applicant','notes','Online form on bzst.de or free-text letter')),
 jsonb_build_array(jsonb_build_object('label','BZSt — request Steuer-ID','url','https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html')),
 jsonb_build_array(
   'Confusing Steuer-ID (11 digits, lifelong) with Steuernummer (issued by local Finanzamt, changes)',
   'Letter returned because name is not on letterbox → arrives back at BZSt as ''nicht zustellbar''',
   'Employers deducting max tax (Steuerklasse VI) until Steuer-ID delivered'),
 'Not applicable — administrative issue, resolved by re-request.',
 'If the client urgently needs it for payroll, the employer can query it via ELStAM using name + DOB + address — no need to wait for the letter.',
 'case_manager','active'),

('fuehrungszeugnis', cat_reg, 'Führungszeugnis — Police clearance certificate',
 'Certificate of no criminal record. Often required for work with children, healthcare jobs, Einbürgerung, visas abroad, some landlord checks.',
 'Any resident ≥14 years old.',
 'Bundeszentralregistergesetz (BZRG) §30.',
 'Federal — issued by Bundesamt für Justiz (BfJ) in Bonn.',
 'Standard (N) 2 weeks; ''Erweitertes'' (child-protection) 2–3 weeks; apostilled version +2 weeks.',
 '€13',
 '€13 per certificate. Apostille +€25. Free if statute (e.g. §30a BZRG unpaid volunteer) applies — bring authority letter.',
 'Online (bund.de) with elektronischer Personalausweis, or at any Bürgeramt in person.',
 jsonb_build_array(
   'Confirm type needed: N (standard), O (authority-addressed), or Erweitertes (extended, work with minors)',
   'Choose channel: online (eID + AusweisApp) or in-person at Bürgeramt',
   'For O / Erweitertes: obtain a written request from the requesting body first',
   'Pay fee; certificate posted from BfJ 5–10 working days later',
   'If used abroad: order Apostille from BfJ (same portal) — mandatory for many consulates'),
 jsonb_build_array('Passport / ID','Written request from employer/authority (for O or Erweitertes)','Confirmation of Anmeldung if newly moved'),
 jsonb_build_array(
   jsonb_build_object('name','Antrag auf Erteilung eines Führungszeugnisses','who','Applicant','notes','Filed at Bürgeramt or online'),
   jsonb_build_object('name','Antrag auf Apostille (BfJ)','who','Applicant','notes','Separate application; needed for use in Hague Convention states')),
 jsonb_build_array(
   jsonb_build_object('label','BfJ — Führungszeugnis online','url','https://www.fuehrungszeugnis.bund.de/'),
   jsonb_build_object('label','Bund.de — Ausweisapp','url','https://www.ausweisapp.bund.de/')),
 jsonb_build_array(
   'Ordering ''N'' when Erweitertes is required — must reorder & pay again',
   'Certificate goes stale fast — many receivers only accept ≤3 months old',
   'Missing Apostille — foreign consulate returns the certificate'),
 'Corrections to register entries: application to BfJ under §34 BZRG. Judicial appeal via Amtsgericht Bonn.',
 'For visa cases, order N + Apostille together at the Bürgeramt to save one trip; add sworn translation immediately.',
 'case_manager','active'),

('sv-nummer', cat_ss, 'Sozialversicherungsnummer (SV-Nummer)',
 '12-character pension insurance number issued by Deutsche Rentenversicherung on first job or on request. Required by every employer.',
 'Everyone who starts statutory employment or requests one.',
 'SGB IV §147 — Versicherungsnummer.',
 'Federal — Deutsche Rentenversicherung Bund / regional offices.',
 'Automatic ~2 weeks after first job registration; manual 3–6 weeks.',
 'Free','Free.',
 'Automatic: Krankenkasse forwards data to DRV after enrolment. Manual: application to Deutsche Rentenversicherung.',
 jsonb_build_array(
   'Enrol in a Krankenkasse first — they trigger the SV number automatically',
   'If needed before Krankenkasse enrolment: submit V0800 to DRV',
   'Employer receives Versicherungsnummer via SV-Meldeverfahren',
   'Client keeps the plastic Sozialversicherungsausweis for life'),
 jsonb_build_array('Passport / ID','Anmeldebestätigung','Existing DRV letters (if any prior insurance episode)'),
 jsonb_build_array(
   jsonb_build_object('name','V0800 — Antrag auf Versicherungsnummer','who','Applicant','notes','DRV PDF; download from deutsche-rentenversicherung.de'),
   jsonb_build_object('name','V0060 — Kontenklärung','who','Applicant','notes','Use to consolidate foreign pension periods later')),
 jsonb_build_array(jsonb_build_object('label','DRV — forms','url','https://www.deutsche-rentenversicherung.de/DRV/DE/Services/Formulare-und-Antraege/formulare-und-antraege_node.html')),
 jsonb_build_array(
   'Duplicate SV numbers when name spelling differs from ID',
   'Foreign pension periods not credited — file V0060 Kontenklärung early'),
 'Widerspruch to DRV within 1 month of decision; then Sozialgericht.',
 'Ask the Krankenkasse to email a formal ''Bestätigung der Versicherungsnummer'' — most employers accept this as interim proof.',
 'case_manager','active'),

('gkv-enrollment', cat_ss, 'Statutory health insurance (GKV) enrolment',
 'Enrol in a gesetzliche Krankenkasse (TK, AOK, Barmer, DAK…). Mandatory for most residents; triggers eGK, SV-Nummer, family co-insurance.',
 'Employees earning ≤ JAEG (2026: ~€73 800), students, jobseekers, pensioners, self-employed opting into GKV.',
 'SGB V §5, §9, §10 (family), §175 (choice of Kasse).',
 'Federal; contribution rate uniform (14.6% + Zusatzbeitrag), Zusatzbeitrag varies by Kasse.',
 'Membership card 1–2 weeks; eGK 2–4 weeks.',
 'Contributions ~ 14.6% + Zusatzbeitrag',
 'Employer & employee each ~7.3% + half of Zusatzbeitrag (avg 1.7%). Self-insured pay full rate. Kinder & non-working spouse free via Familienversicherung.',
 'Any Krankenkasse — apply online or in-branch. Employer registers contribution once enrolled.',
 jsonb_build_array(
   'Compare Zusatzbeitrag & extra benefits (osteopathy, dental, travel)',
   'Submit Mitgliedsantrag online with ID + Anmeldung + employment contract',
   'Kasse issues Mitgliedsbescheinigung → give to employer',
   'Register family members (Familienversicherung) using Fragebogen',
   'eGK arrives; activate NFC PIN if using ePA (electronic patient record)'),
 jsonb_build_array('Passport / ID','Anmeldebestätigung','Employment contract / student ID / benefits decision','Marriage & birth certificates (family co-insurance)','SEPA mandate'),
 jsonb_build_array(
   jsonb_build_object('name','Mitgliedsantrag','who','Applicant','notes','Kasse-specific online form'),
   jsonb_build_object('name','Fragebogen zur Familienversicherung','who','Main insured','notes','Renewed annually for income check on family members'),
   jsonb_build_object('name','Wahltarif application (optional)','who','Applicant','notes','Selbstbehalt / Krankengeld boost / Bonusprogramm')),
 jsonb_build_array(
   jsonb_build_object('label','GKV-Spitzenverband — Kassenfinder','url','https://www.gkv-spitzenverband.de/'),
   jsonb_build_object('label','TK online enrolment','url','https://www.tk.de/mitglied-werden')),
 jsonb_build_array(
   'Freelancers earning ≥ JAEG stuck in expensive freiwillige GKV because they miss the PKV window',
   'Family co-insurance denied for spouse if spouse earns > €505/mo mini-job (2026)',
   'Non-EU students on private travel insurance rejected — must switch to GKV student tariff within 3 months'),
 'Widerspruch to Kasse within 1 month; then Sozialgericht (free of court fees in SG 1st instance).',
 'For late arrivals: ask the Kasse for backdated enrolment from Anmeldung date — usually granted if within 3 months.',
 'case_manager','active')

ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, short_description=EXCLUDED.short_description,
  eligibility=EXCLUDED.eligibility, legal_basis=EXCLUDED.legal_basis,
  jurisdiction_notes=EXCLUDED.jurisdiction_notes, typical_timeline=EXCLUDED.typical_timeline,
  official_fees=EXCLUDED.official_fees, fees_detail=EXCLUDED.fees_detail,
  where_to_apply=EXCLUDED.where_to_apply,
  delivery_playbook=EXCLUDED.delivery_playbook, required_documents=EXCLUDED.required_documents,
  forms=EXCLUDED.forms, online_portals=EXCLUDED.online_portals,
  common_pitfalls=EXCLUDED.common_pitfalls, appeals_process=EXCLUDED.appeals_process,
  tips=EXCLUDED.tips, requires_expert_role=EXCLUDED.requires_expert_role;

END $do$;
