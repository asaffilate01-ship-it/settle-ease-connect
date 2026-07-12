
DO $do$
DECLARE
  cat_h uuid := (SELECT id FROM public.knowledge_categories WHERE slug='housing');
  cat_b uuid := (SELECT id FROM public.knowledge_categories WHERE slug='benefits');
BEGIN

INSERT INTO public.knowledge_services (slug, category_id, name, short_description, eligibility, legal_basis, jurisdiction_notes, typical_timeline, official_fees, fees_detail, where_to_apply, delivery_playbook, required_documents, forms, online_portals, common_pitfalls, appeals_process, tips, requires_expert_role, status) VALUES

('wbs', cat_h, 'Wohnberechtigungsschein (WBS) & Sozialwohnung',
 'Certificate proving low-enough income to rent a Sozialwohnung. WBS itself does not allocate a flat — apply in parallel.',
 'Households whose income does not exceed Bundesland income limits (varies by state & household size).',
 '§27 Wohnraumförderungsgesetz (WoFG); Landeswohnraumförderungsgesetze.',
 'Income limits & WBS levels (100/140/160/180 %) differ per Bundesland; Berlin, München, Hamburg all have distinct rules.',
 '4–8 weeks after complete application.',
 'Free–€25',
 'Bürgeramt fee usually free–€25; renewal every 1 year (Berlin) up to 2 years (NRW).',
 'Wohnungsamt / Bürgeramt of the district. Berlin: separately at Wohnungsamt; München: Amt für Wohnen und Migration.',
 jsonb_build_array(
   'Calculate Jahreseinkommen after §24 WoFG allowances (each child −€500 etc.)',
   'Gather 12-month income proof for every adult in household',
   'Submit WBS application with residence proof and rent situation',
   'Wohnungsamt issues WBS (§5, §5a, §5b levels) valid 1–2 years',
   'Client uses WBS to apply for advertised Sozialwohnungen via municipal portal or housing associations'),
 jsonb_build_array(
   'Passport / ID of all adults',
   'Anmeldebestätigung',
   'Payslips of last 12 months / benefits decisions / self-employed BWA',
   'Rental contract or Kündigung of current flat',
   'Pregnancy proof or Schwerbehindertenausweis (raises priority)'),
 jsonb_build_array(
   jsonb_build_object('name','Antrag auf Wohnberechtigungsschein','who','Household head','notes','Bundesland-specific PDF'),
   jsonb_build_object('name','Einkommenserklärung','who','Every adult in household','notes','Signed under penalty of §156 StGB')),
 jsonb_build_array(
   jsonb_build_object('label','Berlin — WBS','url','https://service.berlin.de/dienstleistung/120671/'),
   jsonb_build_object('label','München — Wohnberechtigung','url','https://stadt.muenchen.de/service/info/wohnberechtigung/1064231/')),
 jsonb_build_array(
   '12 months not fully documented → application returned',
   'WBS expiring during application to a Wohnung — landlord refuses at handover',
   'Client applies for WBS but never applies to any Wohnung — WBS alone gets no flat'),
 'Widerspruch to Wohnungsamt within 1 month; Verwaltungsgericht second stage.',
 'Pair WBS immediately with concrete Sozialwohnung applications (10–20 in parallel) — WBS validity window is short.',
 'case_manager','active'),

('wohngeld', cat_h, 'Wohngeld — Housing benefit',
 'Monthly rent subsidy for low-income households not on Bürgergeld. Wohngeld+ (2023 reform) covers ~4.5 M people.',
 'Households with income above Bürgergeld level but below Wohngeld ceiling; no ALG II/SGB XII overlap.',
 'Wohngeldgesetz (WoGG); §11 rent levels by Mietstufe I–VII.',
 'Mietstufe of the town changes the maximum rent counted. Reassessed regularly.',
 '6–12 weeks; backdated to month of application.',
 'Free','Free to apply. Backdating covers full month of application only.',
 'Wohngeldstelle of the town/city.',
 jsonb_build_array(
   'Screen for Bürgergeld eligibility first — if eligible, Bürgergeld usually wins',
   'Collect 3 months payslips, rental contract, utility statements, savings statements',
   'Complete Wohngeldantrag + Vermieterbescheinigung',
   'Submit to Wohngeldstelle; usually online in newer portals',
   'Bescheid runs 12 months; new application 2 months before expiry'),
 jsonb_build_array(
   'Passport / ID of all adults','Anmeldebestätigung',
   'Rental contract + last Nebenkostenabrechnung',
   'Payslips of last 3 months / benefit decisions',
   'Savings account statements (freezes if >€60 000 single / €90 000 first extra person)',
   'Study certificate for students / BAföG decision'),
 jsonb_build_array(
   jsonb_build_object('name','Antrag auf Wohngeld (Mietzuschuss)','who','Household head','notes','Municipality PDF or online portal'),
   jsonb_build_object('name','Vermieterbescheinigung','who','Landlord','notes','Rent + heating breakdown; landlord obliged to complete'),
   jsonb_build_object('name','Verdienstbescheinigung','who','Employer','notes','Alternative to payslips')),
 jsonb_build_array(jsonb_build_object('label','BMWSB — Wohngeldrechner','url','https://www.bmwsb.bund.de/Webs/BMWSB/DE/themen/stadt-wohnen/wohnraumfoerderung/wohngeld/wohngeldrechner-2023/rechner-2023.html')),
 jsonb_build_array(
   'Heizkosten-Pauschale forgotten in Wohngeld+ calc — clients undershoot by 20 %',
   'Students in BAföG excluded (dem Grunde nach) — apply for Wohnzuschlag in BAföG instead',
   'Household definition includes non-married partners — income aggregates'),
 'Widerspruch within 1 month; then Verwaltungsgericht (not Sozialgericht).',
 'Always run the BMWSB calculator with & without pending Nebenkostenabrechnung — clients often qualify only after annual utility bill lands.',
 'case_manager','active'),

('buergergeld', cat_b, 'Bürgergeld (SGB II)',
 'Basic income + rent + heating for jobseekers and low-income working people below the Bürgergeld need level.',
 'Erwerbsfähig (15 to Regelaltersgrenze), residence in DE, hilfebedürftig.',
 'SGB II — Bürgergeldgesetz (2023 reform).',
 'Regelsatz federally uniform (2026 single ~€563); rent limits set by each Kommune.',
 'First payment 2–6 weeks; interim Vorschuss possible.',
 'Free','No fee. Karenzzeit: first 12 months protects savings up to €40 000 (single) + €15 000 per extra.',
 'Jobcenter of the district.',
 jsonb_build_array(
   'Submit Kurzantrag online (jobcenter.digital) to secure application date',
   'Complete Hauptantrag + Anlagen (KDU, EK, VM, HG, KI, UH1 as needed)',
   'Attend meeting to sign Kooperationsplan',
   'Bescheid issued for 12 months; Weiterbewilligung 2 months before expiry',
   'Report changes within 1 month (job, address, household)'),
 jsonb_build_array(
   'Passport / ID + Anmeldebestätigung of every household member',
   'Rental contract + last Nebenkostenabrechnung',
   'Kontoauszüge of last 3 months (all accounts)',
   'Payslips / Kündigung / self-employment BWA',
   'Krankenversicherungsnachweis','Steuer-ID','Kindergeldbescheid / birth certificates'),
 jsonb_build_array(
   jsonb_build_object('name','Hauptantrag Bürgergeld','who','Household head','notes','Jobcenter Digital or paper'),
   jsonb_build_object('name','Anlage KDU','who','Applicant','notes','Kosten der Unterkunft'),
   jsonb_build_object('name','Anlage EK','who','Each earning member','notes','Einkommen'),
   jsonb_build_object('name','Anlage VM','who','Applicant','notes','Vermögen — savings, cars, life insurance'),
   jsonb_build_object('name','Anlage KI','who','Per child','notes','Child details'),
   jsonb_build_object('name','Kooperationsplan','who','Jobcenter + client','notes','Replaces old Eingliederungsvereinbarung')),
 jsonb_build_array(jsonb_build_object('label','Jobcenter Digital','url','https://www.jobcenter.digital/')),
 jsonb_build_array(
   'Failing to submit Kontoauszüge of every account → Versagung wegen fehlender Mitwirkung',
   'Ignoring Meldeaufforderung → Leistungsminderung 10 %/30 %',
   'Assets above Karenz threshold hidden — recovery + fraud proceedings'),
 'Widerspruch within 1 month; Sozialgericht (free 1st instance) if rejected.',
 'File a Kurzantrag on Day 1 to secure the effective date, then complete paperwork within 4 weeks — beats waiting weeks for an appointment.',
 'case_manager','active'),

('alg1', cat_b, 'Arbeitslosengeld I (ALG I)',
 'Insurance-based unemployment benefit — 60% net (67% with child) for those who paid ≥12 months contributions in the last 30.',
 'Anwartschaftszeit ≥12 months in past 30; unemployed; arbeitsuchend registered.',
 'SGB III §137 ff.',
 'Federal — Agentur für Arbeit.',
 'First payment 3–6 weeks after complete file.',
 'Free','Sperrzeit 12 weeks if resignation without wichtiger Grund; can shorten with proof.',
 'Agentur für Arbeit of home district.',
 jsonb_build_array(
   'Arbeitsuchend melden ≥3 months before end of contract (else Sperrzeit 1 week)',
   'On Day 1 of unemployment: arbeitslos melden in person or via arbeitsagentur.de',
   'Submit Antrag ALG I + Arbeitsbescheinigung (employer) + Krankenkasse membership',
   'Attend Erstberatung; sign Vermittlungsvorschläge',
   'Report holidays, illness, side income — >€165/mo reduces benefit'),
 jsonb_build_array(
   'Passport / ID + Anmeldebestätigung',
   'Arbeitsbescheinigung (§312 SGB III) from every employer of last 5 yrs',
   'Kündigung / Aufhebungsvertrag','Steuer-ID','Krankenversicherungsnachweis','Bank details'),
 jsonb_build_array(
   jsonb_build_object('name','Antrag auf Arbeitslosengeld','who','Applicant','notes','Online via ''eServices'''),
   jsonb_build_object('name','Arbeitsbescheinigung §312 SGB III','who','Employer','notes','Digital via BEA-Verfahren')),
 jsonb_build_array(jsonb_build_object('label','Agentur für Arbeit — ALG I','url','https://www.arbeitsagentur.de/arbeitslos-arbeit-finden/arbeitslosengeld')),
 jsonb_build_array(
   'Late Arbeitsuchendmeldung → 1-week Sperrzeit',
   'Aufhebungsvertrag without Abfindungsgrund → 12-week Sperrzeit',
   'Missing Arbeitsbescheinigung from foreign employer — file U1 form from EU home authority'),
 'Widerspruch to Agentur within 1 month; Sozialgericht.',
 'For voluntary termination with strong reason (mobbing, health), collect written evidence early — it converts a 12-week Sperrzeit into 0.',
 'case_manager','active'),

('elterngeld', cat_b, 'Elterngeld (Basis, Plus, Partnermonate)',
 'Income replacement (65–100 % net, min €300, max €1 800) during parental leave. Elterngeld Plus doubles the months at half amount + Partnermonate.',
 'Parent living with child, ≤32 h/week work during Bezug, taxable income <€175 000/yr couple (from 2024) / €150 000 (from Apr 2025).',
 'BEEG.',
 'Federal law; each Land has its own Elterngeldstelle. ElterngeldDigital covers most.',
 '6–10 weeks to first payment.',
 'Free','No fee. Retroactive up to 3 months only — file early.',
 'Elterngeldstelle of the Bundesland (Jugendamt/Landratsamt/L-Bank in BW).',
 jsonb_build_array(
   'Decide Basiselterngeld vs Plus vs Kombination; run the calculator',
   'Both parents plan Elternzeit at employer ≥7 weeks before start (§16 BEEG)',
   'Submit Elterngeldantrag within 3 months of birth',
   'Provide income proof for the 12 months before the ''child-related month''',
   'Bescheid arrives; corrections filed via Änderungsantrag'),
 jsonb_build_array(
   'Geburtsurkunde with ''Elterngeld'' Verwendungszweck',
   'IDs / passports of both parents','Anmeldebestätigung of child',
   'Employer Elternzeit acknowledgement',
   '12 payslips (employees) or last tax assessment (self-employed)',
   'Mutterschaftsgeldbescheinigung (Krankenkasse) — deducted from Elterngeld','Krankenkassenbescheinigung'),
 jsonb_build_array(
   jsonb_build_object('name','Antrag auf Elterngeld','who','Each parent','notes','ElterngeldDigital for most Länder'),
   jsonb_build_object('name','Arbeitgeberbescheinigung Mutterschutz','who','Employer','notes','Netto & Zuschuss'),
   jsonb_build_object('name','Elternzeitantrag','who','Employee','notes','7-week deadline to employer; recorded in writing')),
 jsonb_build_array(jsonb_build_object('label','ElterngeldDigital','url','https://www.elterngeld-digital.de/')),
 jsonb_build_array(
   'Filing later than month 3 — each late month is lost forever',
   'Second parent misses Partnermonate window — flexibility is limited',
   'Mutterschaftsgeld weeks overlap → those months treated as Basiselterngeld even if Plus was chosen'),
 'Widerspruch within 1 month; Sozialgericht.',
 'Model Basis vs Plus with the family — Plus is almost always better for the second parent doing part-time work.',
 'case_manager','active'),

('kindergeld', cat_b, 'Kindergeld',
 '€250/month per child (2026 rate) paid by Familienkasse. Applied for at birth; continues in school/education/apprenticeship up to 25.',
 'Child living in DE (or EU/EEA/Switzerland under coordination rules); parent unbeschränkt steuerpflichtig or with equivalent status.',
 'EStG §62–78; BKGG.',
 'Federal. Non-EU parents need residence title with employment access.',
 '4–6 weeks; backdated only 6 months (since 2019).',
 'Free','Free. Retroactive limit 6 months since 2019 — file quickly.',
 'Familienkasse (Bundesagentur für Arbeit).',
 jsonb_build_array(
   'Get Geburtsurkunde + Steuer-IDs of both parents & child',
   'File KG1 + Anlage Kind online',
   'For 18–25 year olds: submit school/uni/apprenticeship proof each academic year',
   'Report abroad periods, marriage of child, employment >20h — can end entitlement',
   'Reconcile at end of year in Einkommensteuererklärung — Günstigerprüfung Kindergeld vs Freibeträge'),
 jsonb_build_array('Geburtsurkunde child','Steuer-IDs of both parents + child','Aufenthaltstitel (non-EU parent)','School / study certificate (if child 18–25)'),
 jsonb_build_array(
   jsonb_build_object('name','KG1 Antrag auf Kindergeld','who','Custodial parent','notes','Familienkasse'),
   jsonb_build_object('name','Anlage Kind','who','Per child','notes','Attached to KG1'),
   jsonb_build_object('name','Anlage Ausland','who','Applicant','notes','If child lives in EU/EWR')),
 jsonb_build_array(jsonb_build_object('label','Familienkasse Online','url','https://www.arbeitsagentur.de/familie-und-kinder/kindergeld-beantragen')),
 jsonb_build_array(
   'Retro > 6 months lost',
   'Second parent working abroad — EU coordination decides which state pays; file A1',
   'Adult child in Zwischenzeit >4 months without training loses claim'),
 'Widerspruch to Familienkasse within 1 month; Finanzgericht.',
 'For non-EU parents new to Germany, always file the same week Steuer-IDs arrive — the 6-month retro limit is unforgiving.',
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
