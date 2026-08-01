
DO $do$
DECLARE
  cat_hc uuid := (SELECT id FROM public.knowledge_categories WHERE slug='healthcare');
  cat_fam uuid := (SELECT id FROM public.knowledge_categories WHERE slug='family');
BEGIN

INSERT INTO public.knowledge_services (slug, category_id, name, short_description, eligibility, legal_basis, jurisdiction_notes, typical_timeline, official_fees, fees_detail, where_to_apply, delivery_playbook, required_documents, forms, online_portals, common_pitfalls, appeals_process, tips, requires_expert_role, status) VALUES

('gp-registration', cat_hc, 'Hausarzt (GP) registration & referrals',
 'Choose a Hausarzt as first point of care. GPs coordinate referrals (Überweisung) to specialists and issue Krankschreibungen (AU).',
 'Anyone with eGK — GKV or PKV.',
 'SGB V §73 — Hausarztzentrierte Versorgung.',
 'Practice availability varies. Rural: KV can assign; cities: many practices ''Aufnahmestopp''.',
 'First appointment 1–6 weeks; acute same-day via 116117.',
 'Free (GKV) at point of care',
 'GKV pays. €10 replacement for lost eGK. IGeL services private — must be quoted in writing.',
 'Any practice with Kassenzulassung. Find via KBV Arztsuche or Terminservicestellen (116117).',
 jsonb_build_array(
   'Find practice: kbv.de/arztsuche or 116117',
   'Call to confirm they accept new patients + language spoken',
   'First visit: bring eGK + medication & allergy list + vaccination card',
   'Sign Hausarztvertrag if opting into HZV (better care coordination)',
   'Specialist needed → Überweisung; urgent → 116117 books ≤4 weeks'),
 jsonb_build_array('eGK (electronic health card)','Photo ID','Impfpass (vaccination record)','Prior discharge letters / MRI-CDs','Medication list'),
 jsonb_build_array(
   jsonb_build_object('name','Aufnahmebogen','who','Patient','notes','Practice-specific'),
   jsonb_build_object('name','Datenschutzeinwilligung','who','Patient','notes','DSGVO consent for data processing'),
   jsonb_build_object('name','HZV-Teilnahmeerklärung (optional)','who','Patient','notes','Locks in Hausarzt for 1 yr, coordinated care')),
 jsonb_build_array(
   jsonb_build_object('label','KBV Arztsuche','url','https://arztsuche.116117.de/'),
   jsonb_build_object('label','Terminservice 116117','url','https://www.116117.de/')),
 jsonb_build_array(
   'Turning up without eGK → practice may charge private + refund on presentation within 10 days',
   'Assuming GP can refer directly to psychotherapy — needs separate Sprechstunden-Code'),
 'Complaint to Kassenärztliche Vereinigung of the Bundesland; parallel Beschwerde to Ärztekammer.',
 'Register a language-matched Hausarzt as soon as Anmeldung is done — waiting until sickness is too late.',
 'case_manager','active'),

('eheschliessung', cat_fam, 'Eheschließung — Civil marriage at Standesamt',
 'Legal marriage in Germany is only valid if performed at a Standesamt. Religious ceremony is optional and has no civil effect.',
 'Both partners ≥18, unmarried (or divorced/widowed with proof), capable of consenting.',
 'PStG §11–15; EGBGB Art. 13 (foreign nationals apply their home law for capacity).',
 'Documents from abroad must be legalised (Apostille or embassy legalisation) + sworn translation.',
 'Full prep 6–12 weeks; foreign docs 3–6 months if legalisation abroad required.',
 '€40–€200',
 'Anmeldung der Eheschließung €40–€80; ceremony fee €40–€100; extra for Saturday, English, off-premise; certificates €12 each; Ehefähigkeitszeugnis fee depends on home authority.',
 'Standesamt of the district where either partner is registered.',
 jsonb_build_array(
   'Both partners: collect birth certificate ≤6 months old + Apostille + sworn translation',
   'Foreign nationals: obtain Ehefähigkeitszeugnis (or Befreiung via OLG if home country doesn''t issue one)',
   'Book Anmeldung der Eheschließung appointment; both partners appear in person',
   'Standesbeamter reviews; if OLG-Befreiung needed, wait 8–12 weeks',
   'Book ceremony date once Anmeldung is accepted (valid 6 months)',
   'Ceremony: bring IDs + 2 witnesses (optional); collect Eheurkunde afterwards',
   'Post-marriage: update passport, Anmeldung name change, banks, insurance, Ausländerbehörde'),
 jsonb_build_array(
   'Passport (both)',
   'Certified birth certificate (≤6 months) with Apostille & sworn translation',
   'Erweiterte Meldebescheinigung (≤14 days)',
   'Ehefähigkeitszeugnis (or OLG Befreiung certificate)',
   'Prior marriage: divorce decree with Apostille + Anerkennung by Landesjustizverwaltung (if divorced abroad)',
   'If children exist: birth certificates',
   'If a partner is stateless/refugee: recognised travel document + BAMF status'),
 jsonb_build_array(
   jsonb_build_object('name','Anmeldung der Eheschließung','who','Both partners','notes','Standesamt form; both sign in presence of Standesbeamter'),
   jsonb_build_object('name','Antrag auf Befreiung vom Ehefähigkeitszeugnis','who','Partner from country not issuing EFZ','notes','Filed via Standesamt to OLG; €30–€305 depending on income'),
   jsonb_build_object('name','Erklärung zur Namensführung','who','Both partners','notes','Choose Ehename — can be filed at ceremony or later')),
 jsonb_build_array(
   jsonb_build_object('label','Auswärtiges Amt — legalisation','url','https://www.auswaertiges-amt.de/de/service/konsularinfo/internationaler-urkundenverkehr'),
   jsonb_build_object('label','BADV — Apostille','url','https://www.bva.bund.de/')),
 jsonb_build_array(
   'Assuming religious marriage is enough — it is not',
   'Foreign divorce not recognised (Anerkennung by Landesjustiz) → new marriage refused',
   'Ehefähigkeitszeugnis expired (only 6 months validity)',
   'Names on documents do not match transliteration in passport'),
 'Standesamt refusal → Antrag auf gerichtliche Entscheidung to Amtsgericht (family court) within 1 month.',
 'Book the OLG-Befreiung as soon as the missing EFZ is confirmed — it is the slowest step by far. Use consular pre-check for divorce recognition to save 3 months.',
 'case_manager','active'),

('geburt-anmeldung', cat_fam, 'Newborn — birth registration & follow-ups',
 'Register the birth at Standesamt within 1 week, then trigger Steuer-ID, Kindergeld, health insurance, Elterngeld, Anerkennung der Vaterschaft (if unmarried), Sorgeerklärung.',
 'Every child born in Germany.',
 'PStG §18–21 (birth registration); BGB §1592–1600 (paternity); SGB IV §25a (Kindergeld ID).',
 'Standesamt of the birth district. Hospital forwards the Geburtsanzeige within 1 week automatically.',
 'Geburtsurkunde 1–3 weeks; Kindergeld 4–6 weeks; Elterngeld 6–10 weeks.',
 '€12–€40 per certificate',
 'First internationale Geburtsurkunde often free; extra copies €12–€15. Anerkennung der Vaterschaft & Sorgeerklärung free at Jugendamt.',
 'Standesamt of birth district (hospital gives the pre-filled folder).',
 jsonb_build_array(
   'Hospital forwards Geburtsanzeige to Standesamt',
   'Parents visit Standesamt within 7 days with IDs, marriage cert (or Anerkennung + Sorgeerklärung) and choose Geburtsname',
   'Order at least 4 Geburtsurkunden + 1 international (for embassies/Kindergeld/insurance/Elterngeld)',
   'Add child to Krankenkasse (Familienversicherung) within 2 months (backdated to birth)',
   'File Kindergeld application at Familienkasse online',
   'File Elterngeld before end of 3rd month post-birth (loses 1 month for every month late)',
   'For non-married fathers: Anerkennung der Vaterschaft (Standesamt/Jugendamt) + Sorgeerklärung',
   'Register child at Meldebehörde (usually automatic)'),
 jsonb_build_array(
   'Parents'' passports/IDs',
   'Marriage certificate (if married; with Apostille & translation if foreign)',
   'Mother''s birth certificate',
   'Father''s birth certificate (if unmarried, plus Vaterschaftsanerkennung)',
   'Anmeldebestätigung of parents',
   'Hospital Geburtsbescheinigung'),
 jsonb_build_array(
   jsonb_build_object('name','Anzeige der Geburt (hospital)','who','Hospital','notes','Automatically forwarded'),
   jsonb_build_object('name','Vaterschaftsanerkennung','who','Father (with mother''s consent)','notes','Standesamt or Jugendamt; free'),
   jsonb_build_object('name','Sorgeerklärung','who','Both parents','notes','Joint custody for unmarried parents; Jugendamt; free'),
   jsonb_build_object('name','Antrag auf Kindergeld (KG1 + Anlage Kind)','who','Custodial parent','notes','Familienkasse; online or paper'),
   jsonb_build_object('name','Antrag auf Elterngeld','who','Either parent','notes','Länder-specific Elterngeldstelle; ElterngeldDigital available in most Länder'),
   jsonb_build_object('name','Familienversicherung Fragebogen','who','Insured parent','notes','Krankenkasse; backdate to birth date')),
 jsonb_build_array(
   jsonb_build_object('label','Familienkasse (Kindergeld)','url','https://www.arbeitsagentur.de/familie-und-kinder/kindergeld-beantragen'),
   jsonb_build_object('label','Elterngeld Digital','url','https://www.elterngeld-digital.de/')),
 jsonb_build_array(
   'Elterngeld filed late → each late month is forfeit',
   'Vaterschaftsanerkennung filed after birth abroad not recognised — needs German-form document',
   'Non-EU parents forget to request child''s Aufenthaltstitel within 6 months (§33 AufenthG)'),
 'Widerspruch to Standesamt (§48 PStG) → Amtsgericht. Familienkasse decisions → Widerspruch then Finanzgericht.',
 'Ask the Standesamt to issue the international Geburtsurkunde in the parents'' language state — saves later translation costs for consulate name registration.',
 'case_manager','active'),

('sterbefall', cat_fam, 'Sterbefall — Death registration & first steps',
 'Register the death at the Standesamt of the place of death within 3 working days; unlocks Sterbeurkunden needed for burial, banks, pensions, insurance, inheritance.',
 'Family / funeral director on behalf of any death occurring in Germany.',
 'PStG §28–33.',
 'Standesamt of place of death; not the deceased''s home Standesamt.',
 'Sterbeurkunde 1–5 working days; full estate processes weeks–months.',
 '€12+ per certificate',
 'First few Sterbeurkunden €12–€15 each; ''für Rentenzwecke'' & ''für Sozialversicherung'' issued free.',
 'Standesamt of the district where the death occurred.',
 jsonb_build_array(
   'Funeral director collects Todesbescheinigung from the certifying doctor',
   'File with Standesamt within 3 working days with IDs, marriage/birth certs of deceased',
   'Order Sterbeurkunden: 1× family, 2× bank/insurance, 1× pension, 1× employer, extras',
   'Notify: Krankenkasse, DRV, employer, banks, landlord, Rundfunkbeitrag, insurances',
   'File pension claims (Witwenrente §46 SGB VI)',
   'File Sterbevierteljahr with employer (3 months full salary continuation)',
   'Open probate: Nachlassgericht at last residence — apply for Erbschein if needed'),
 jsonb_build_array(
   'Todesbescheinigung (doctor)',
   'Passport / ID of deceased',
   'Birth certificate of deceased',
   'Marriage certificate (if applicable)',
   'Divorce decree / spouse''s death certificate (if applicable)',
   'Anmeldebestätigung of deceased'),
 jsonb_build_array(
   jsonb_build_object('name','Anzeige eines Sterbefalls','who','Family / funeral director','notes','Standesamt form'),
   jsonb_build_object('name','Antrag auf Erbschein','who','Heirs','notes','Nachlassgericht (Amtsgericht); required for real estate'),
   jsonb_build_object('name','Antrag auf Witwen-/Witwerrente (R0500)','who','Surviving spouse','notes','DRV form; 30-day Sterbevierteljahr advance possible')),
 jsonb_build_array(jsonb_build_object('label','DRV — Hinterbliebenenrente','url','https://www.deutsche-rentenversicherung.de/DRV/DE/Rente/Hinterbliebene/hinterbliebene_node.html')),
 jsonb_build_array(
   'Order too few Sterbeurkunden — each institution keeps a copy; reorder costs money & days',
   'Estate accepted before checking debts — heirs personally liable; Ausschlagung deadline 6 weeks',
   'Repatriation abroad blocked — need Leichenpass (embassy) + sealing certificate'),
 'Standesamt refusal → Amtsgericht within 1 month. Rentenversicherung refusal → Widerspruch then Sozialgericht.',
 'For repatriation cases, brief the funeral partner immediately — Leichenpass and consulate slots are the critical path.',
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
