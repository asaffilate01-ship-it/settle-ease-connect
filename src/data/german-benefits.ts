// Consolidated catalog of German benefits, entitlements, tax reliefs and
// social-insurance schemes commonly relevant to migrant / expat households.
// 2026 rates and forms as published by BMFSFJ, BMAS, BMWSB, BMG, Familienkasse,
// Bundesagentur für Arbeit, Deutsche Rentenversicherung, GKV-Spitzenverband,
// Versorgungsämter, Bundeszentralamt für Steuern.
//
// Indicative only — not legal advice. Amounts and thresholds change annually.

export type BenefitCategory =
  | "family"
  | "housing"
  | "income"
  | "student"
  | "pension"
  | "disability"
  | "illness"
  | "care"
  | "unemployment"
  | "tax"
  | "social_insurance";

export type BenefitForm = {
  code: string;                  // official form number / short code
  title: string;                 // human name
  url?: string;                  // direct link to the PDF / online form
};

export type Benefit = {
  key: string;
  name: string;                  // English name
  german: string;                // German official name
  summary: string;
  monthly?: string;              // headline amount as a string
  category: BenefitCategory;
  authority: string;             // Familienkasse, Jobcenter, Krankenkasse, Finanzamt, …
  eligibleIf: string[];
  forms: BenefitForm[];          // application forms
  documents: string[];           // identity / status documents to attach
  proofs: string[];              // situation-specific evidence
  applyUrl?: string;             // online portal to apply / start
  notes?: string;                // caveats, deadlines, tips
};

export const CATEGORY_LABEL: Record<BenefitCategory, string> = {
  family: "Family",
  housing: "Housing",
  income: "Income support",
  student: "Study & training",
  pension: "Pension",
  disability: "Disability",
  illness: "Illness & rehab",
  care: "Long-term care",
  unemployment: "Unemployment",
  tax: "Tax reliefs",
  social_insurance: "Social insurance",
};

// Shared document shorthands to keep the catalog readable.
const ID_DOCS = [
  "Valid passport or national ID",
  "Residence permit (Aufenthaltstitel) if non-EU",
  "Anmeldebestätigung (address registration)",
  "Tax ID (Steuer-Identifikationsnummer)",
];
const INCOME_DOCS = [
  "Last 3 payslips (Lohn-/Gehaltsabrechnung)",
  "Employment contract or self-employment income statement",
  "Bank statements (last 3 months)",
];

export const benefits: Benefit[] = [
  // ---------------- FAMILY ----------------
  {
    key: "kindergeld",
    name: "Child Benefit",
    german: "Kindergeld",
    summary: "Monthly payment for every child under 18 (up to 25 if in education/training).",
    monthly: "€255 / child",
    category: "family",
    authority: "Familienkasse (Bundesagentur für Arbeit)",
    eligibleIf: [
      "Registered address (Anmeldung) in Germany",
      "Legal residence permit or EU citizenship",
      "Child lives in your household or in the EU/EEA",
    ],
    forms: [
      { code: "KG 1", title: "Antrag auf Kindergeld", url: "https://www.arbeitsagentur.de/datei/kg1-kindergeldantrag_ba013008.pdf" },
      { code: "KG 1-Anlage Kind", title: "Anlage Kind (one per child)" },
      { code: "KG 51", title: "Anlage Ausland (if child abroad)" },
    ],
    documents: [
      ...ID_DOCS,
      "Child's birth certificate (translated & apostilled if foreign)",
      "Child's Steuer-ID",
      "Custody proof if separated",
    ],
    proofs: [
      "School / university / apprenticeship certificate for children 18–25",
      "Marriage certificate if claiming for stepchildren",
    ],
    applyUrl: "https://www.arbeitsagentur.de/familie-und-kinder/kindergeld-antrag",
    notes: "Apply within 6 months of birth for full back-payment.",
  },
  {
    key: "elterngeld",
    name: "Parental Allowance",
    german: "Elterngeld / ElterngeldPlus",
    summary: "Income replacement (65–67%) for parents who reduce working hours after birth.",
    monthly: "€300–€1,800",
    category: "family",
    authority: "Elterngeldstelle (Bezirksamt / Jugendamt)",
    eligibleIf: [
      "Baby under 14 months (Basiselterngeld)",
      "Working ≤ 32h/week during the claim",
      "Legal residence with permit allowing work",
    ],
    forms: [
      { code: "Elterngeld-Antrag", title: "Antrag auf Elterngeld (state-specific PDF)" },
      { code: "Anlage N", title: "Nachweis Einkommen aus nichtselbständiger Arbeit" },
      { code: "Anlage S", title: "Nachweis Einkommen aus selbständiger Arbeit" },
    ],
    documents: [
      ...ID_DOCS,
      "Original birth certificate with 'Verwendungszweck: Elterngeld'",
      "Health insurance confirmation",
      "Employer confirmation of parental leave (Bescheinigung Elternzeit)",
    ],
    proofs: [
      "12 months of payslips before birth",
      "Tax assessment (Steuerbescheid) for self-employed",
      "Mutterschaftsgeld notice from Krankenkasse",
    ],
    applyUrl: "https://www.elterngeld-digital.de",
    notes: "Apply within the first 3 months to avoid losing months of payment.",
  },
  {
    key: "kinderzuschlag",
    name: "Child Supplement",
    german: "Kinderzuschlag (KiZ)",
    summary: "Up to €297 per child for low-income working parents who don't qualify for Bürgergeld.",
    monthly: "up to €297 / child",
    category: "family",
    authority: "Familienkasse",
    eligibleIf: [
      "Parent(s) earn at least €900 (couples) or €600 (single) gross/month",
      "Household income too low to cover children's needs",
      "Receives or is eligible for Kindergeld",
    ],
    forms: [
      { code: "KiZ 1", title: "Hauptantrag Kinderzuschlag", url: "https://www.arbeitsagentur.de/datei/kiz1_ba014396.pdf" },
      { code: "KiZ-Anlage Kind", title: "Anlage Kind" },
      { code: "KiZ-Anlage Einkommen", title: "Anlage Einkommen (per adult)" },
    ],
    documents: [...ID_DOCS, "Rental contract + last utility bill", "Health insurance card"],
    proofs: [...INCOME_DOCS, "Rent + heating cost proof", "Child-care cost proof"],
    applyUrl: "https://www.arbeitsagentur.de/familie-und-kinder/kinderzuschlag-antrag",
  },
  {
    key: "unterhaltsvorschuss",
    name: "Advance Maintenance Payment",
    german: "Unterhaltsvorschuss",
    summary: "State advances child maintenance when the other parent does not pay.",
    monthly: "€230–€395 / child",
    category: "family",
    authority: "Jugendamt / Unterhaltsvorschusskasse",
    eligibleIf: [
      "Child lives with a single parent",
      "Other parent pays no or reduced maintenance",
      "Child under 18",
    ],
    forms: [{ code: "UVG", title: "Antrag Unterhaltsvorschuss (Kommune)" }],
    documents: [
      ...ID_DOCS,
      "Child's birth certificate",
      "Custody decision or proof of separation",
      "Any existing maintenance title (Unterhaltstitel)",
    ],
    proofs: ["Bank statements showing missing payments", "Correspondence with the other parent"],
  },
  {
    key: "mutterschaftsgeld",
    name: "Maternity Pay",
    german: "Mutterschaftsgeld",
    summary: "Full net income replacement 6 weeks before and 8 weeks after birth (12 for multiples).",
    monthly: "up to €13 / day + employer top-up",
    category: "family",
    authority: "Statutory Krankenkasse (GKV)",
    eligibleIf: [
      "Statutorily insured with sick-pay entitlement",
      "Pregnant with medical Mutterpass",
      "In employment or Elterngeld-relevant income",
    ],
    forms: [{ code: "Muschg", title: "Antrag Mutterschaftsgeld der Krankenkasse" }],
    documents: [...ID_DOCS, "Mutterpass", "Employer confirmation"],
    proofs: ["Doctor's certificate with expected delivery date"],
  },
  {
    key: "entlastungsbetrag_ae",
    name: "Single-Parent Tax Relief",
    german: "Entlastungsbetrag für Alleinerziehende",
    summary: "€4,260 base + €240 per additional child, deducted from taxable income.",
    monthly: "≈ €80–€150 / month tax saving",
    category: "tax",
    authority: "Finanzamt (Steuerklasse II)",
    eligibleIf: [
      "Single parent living alone with at least one child",
      "Child registered at your address and eligible for Kindergeld",
    ],
    forms: [
      { code: "Anlage Kind", title: "Anlage Kind zur Einkommensteuererklärung" },
      { code: "Steuerklassenwechsel", title: "Antrag Wechsel Steuerklasse II" },
    ],
    documents: [...ID_DOCS, "Meldebescheinigung showing single-adult household"],
    proofs: ["Kindergeld notice", "School enrolment for the child"],
  },

  // ---------------- HOUSING ----------------
  {
    key: "wohngeld",
    name: "Housing Benefit",
    german: "Wohngeld",
    summary: "Rent subsidy for low-income working households not on Bürgergeld.",
    monthly: "€100–€800",
    category: "housing",
    authority: "Wohngeldbehörde (Bezirksamt)",
    eligibleIf: [
      "Legal residence & registered rental contract",
      "Household income below regional cap",
      "Not receiving Bürgergeld / Sozialhilfe / BAföG",
    ],
    forms: [
      { code: "Wohngeldantrag", title: "Antrag auf Wohngeld (Mietzuschuss)" },
      { code: "Vermieterbescheinigung", title: "Bescheinigung des Vermieters" },
      { code: "Verdienstbescheinigung", title: "Verdienstbescheinigung Arbeitgeber" },
    ],
    documents: [...ID_DOCS, "Rental contract", "Utility & heating bills"],
    proofs: [...INCOME_DOCS, "Health insurance & pension contribution proof"],
  },
  {
    key: "wbs",
    name: "Social Housing Certificate",
    german: "Wohnberechtigungsschein (WBS)",
    summary: "Entitles you to apply for state-subsidised (Sozialwohnung) apartments.",
    category: "housing",
    authority: "Wohnungsamt (Bezirksamt)",
    eligibleIf: [
      "Household income under state-set income limits",
      "Legal residence in Germany for at least 12 months",
    ],
    forms: [{ code: "WBS-Antrag", title: "Antrag auf Wohnberechtigungsschein" }],
    documents: [...ID_DOCS, "Rental contract or written housing search proof"],
    proofs: [...INCOME_DOCS, "Tax assessment (Steuerbescheid) if available"],
  },
  {
    key: "heizkostenzuschuss",
    name: "Heating Cost Subsidy",
    german: "Heizkostenzuschuss",
    summary: "One-off support toward heating bills for Wohngeld / BAföG / Ausbildungsbeihilfe recipients.",
    category: "housing",
    authority: "Wohngeldbehörde",
    eligibleIf: ["Currently receiving Wohngeld, BAföG or BAB in the reference period"],
    forms: [{ code: "Automatisch", title: "Paid automatically — no separate application" }],
    documents: ["Copy of Wohngeld / BAföG / BAB decision"],
    proofs: ["Heating bill copy if requested by authority"],
  },

  // ---------------- INCOME SUPPORT ----------------
  {
    key: "buergergeld",
    name: "Basic Income Support",
    german: "Bürgergeld (SGB II)",
    summary: "Minimum living support including rent, heating and health insurance for job-seekers.",
    monthly: "€563 / adult + rent + heating",
    category: "income",
    authority: "Jobcenter",
    eligibleIf: [
      "Legal residence with access to labour market",
      "Able to work at least 3 h / day",
      "Household assets below Schonvermögen threshold",
    ],
    forms: [
      { code: "HA", title: "Hauptantrag Bürgergeld", url: "https://www.arbeitsagentur.de/datei/ba015207.pdf" },
      { code: "WEP", title: "Anlage WEP (weitere Personen im Haushalt)" },
      { code: "KDU", title: "Anlage KDU (Kosten der Unterkunft)" },
      { code: "EK", title: "Anlage EK (Einkommen)" },
      { code: "VM", title: "Anlage VM (Vermögen)" },
    ],
    documents: [
      ...ID_DOCS,
      "Rental contract + latest heating statement",
      "Bank statements for all household accounts (last 3 months)",
    ],
    proofs: [
      ...INCOME_DOCS,
      "Job-search evidence / Arbeitsuchendmeldung",
      "Health insurance card or letter",
    ],
  },
  {
    key: "sozialhilfe",
    name: "Social Assistance (SGB XII)",
    german: "Sozialhilfe / Hilfe zum Lebensunterhalt",
    summary: "Livelihood support for people temporarily unable to work who don't qualify for Bürgergeld.",
    monthly: "€563 / adult + rent",
    category: "income",
    authority: "Sozialamt",
    eligibleIf: [
      "Unable to work < 3 h/day for at least 6 months",
      "Not entitled to Bürgergeld or pension",
      "Assets below Schonvermögen",
    ],
    forms: [{ code: "SGB XII Antrag", title: "Antrag auf Leistungen nach dem SGB XII" }],
    documents: [...ID_DOCS, "Rental contract", "Bank statements 3 months"],
    proofs: [
      "Medical certificate on ability to work",
      ...INCOME_DOCS,
      "Pension / benefit decisions",
    ],
  },
  {
    key: "grundsicherung_alter_em",
    name: "Basic Security in Old Age / Reduced Earning Capacity",
    german: "Grundsicherung im Alter und bei Erwerbsminderung",
    summary: "Minimum income for retirees or those with permanently reduced earning capacity.",
    monthly: "€563 / adult + rent + heating",
    category: "income",
    authority: "Sozialamt (Grundsicherungsstelle)",
    eligibleIf: [
      "At retirement age OR permanently unable to work",
      "Pension or income below Grundsicherung need",
      "Legal residence with settled status",
    ],
    forms: [{ code: "GruSi", title: "Antrag Grundsicherung nach 4. Kapitel SGB XII" }],
    documents: [...ID_DOCS, "Pension decisions", "Rental contract"],
    proofs: ["Rentenbescheid", "Medical proof of Erwerbsminderung if under retirement age"],
  },

  // ---------------- STUDENT & TRAINING ----------------
  {
    key: "bafog",
    name: "Student Grant / Loan",
    german: "BAföG",
    summary: "Study financing — 50 % grant, 50 % interest-free loan (max €992 / month).",
    monthly: "up to €992",
    category: "student",
    authority: "BAföG-Amt (Studentenwerk)",
    eligibleIf: [
      "Enrolled at a recognised university or Fachschule",
      "Under 45 at start of studies",
      "Parental income below cap (or 5+ years of prior work in Germany)",
    ],
    forms: [
      { code: "Formblatt 1", title: "Hauptantrag BAföG" },
      { code: "Formblatt 3", title: "Einkommensnachweis Eltern / Ehepartner" },
      { code: "Formblatt 5", title: "Studien-/Ausbildungsnachweis" },
    ],
    documents: [...ID_DOCS, "Immatrikulationsbescheinigung", "Health insurance proof"],
    proofs: ["Parents' tax assessments (Steuerbescheid) last 2 years", "Rental contract if living alone"],
    applyUrl: "https://www.bafoeg-digital.de",
  },
  {
    key: "aufstiegs_bafog",
    name: "Career Advancement Loan",
    german: "Aufstiegs-BAföG (Meister-BAföG)",
    summary: "Support for professional upskilling (Meister, Techniker, Fachwirt).",
    monthly: "up to €963 living + course fees",
    category: "student",
    authority: "BAföG-Amt / Landesamt",
    eligibleIf: [
      "Preparing for a recognised advancement qualification",
      "Course of at least 400 hours or 200 hours (part-time)",
    ],
    forms: [{ code: "AFBG", title: "Antrag Aufstiegs-BAföG" }],
    documents: [...ID_DOCS, "Course contract", "Existing vocational qualification"],
    proofs: ["Curriculum / hour breakdown", "Employer confirmation if part-time"],
  },
  {
    key: "bildungspaket",
    name: "Education & Participation Package",
    german: "Bildungs- und Teilhabepaket (BuT)",
    summary: "School supplies, lunches, tutoring and club fees for children in low-income households.",
    monthly: "€15 club + €195 / year school supplies + lunches",
    category: "family",
    authority: "Jobcenter / Sozialamt / Bildungsträger",
    eligibleIf: [
      "Household receives Bürgergeld, Sozialhilfe, Wohngeld, Kinderzuschlag or Asylbewerberleistungen",
      "Child under 25 in school, kindergarten or Kita",
    ],
    forms: [{ code: "BuT-Antrag", title: "Antrag Bildung und Teilhabe (Kommune)" }],
    documents: [...ID_DOCS, "Current benefit decision", "School / club confirmation"],
    proofs: ["Invoice / offer from tutor, club or trip organiser"],
  },

  // ---------------- PENSION ----------------
  {
    key: "rente",
    name: "State Pension",
    german: "Gesetzliche Altersrente",
    summary: "Retirement pension based on contribution years and average earnings.",
    category: "pension",
    authority: "Deutsche Rentenversicherung (DRV)",
    eligibleIf: [
      "At least 5 years of contributions (Wartezeit)",
      "Retirement age reached (currently 66)",
      "Foreign years may count via bilateral agreements",
    ],
    forms: [
      { code: "V0100", title: "Antrag auf Versichertenrente" },
      { code: "V0800", title: "Anlage Ausland" },
    ],
    documents: [...ID_DOCS, "Full CV with all employers", "Bank account IBAN"],
    proofs: [
      "Foreign work history (translated)",
      "Marriage / divorce certificates for Rentensplitting",
    ],
    applyUrl: "https://www.deutsche-rentenversicherung.de",
  },
  {
    key: "erwerbsminderungsrente",
    name: "Reduced Earning Capacity Pension",
    german: "Erwerbsminderungsrente",
    summary: "Pension when illness / disability makes working ≥ 6h/day impossible for ≥ 6 months.",
    monthly: "≈ 34–75 % of average net income",
    category: "pension",
    authority: "Deutsche Rentenversicherung",
    eligibleIf: [
      "At least 5 years of contributions incl. 3 years in the last 5",
      "Medical earning capacity < 6 h/day (partial) or < 3 h/day (full)",
    ],
    forms: [
      { code: "R0100", title: "Antrag auf Erwerbsminderungsrente" },
      { code: "S0050", title: "Selbsteinschätzungsbogen" },
    ],
    documents: [...ID_DOCS, "All medical reports (Ärztliche Befundberichte)"],
    proofs: ["Krankenkasse Krankengeld notice", "Rehabilitation reports"],
  },
  {
    key: "hinterbliebenenrente",
    name: "Survivors' Pension",
    german: "Witwen-/Witwer-/Waisenrente",
    summary: "Pension for spouses and children after the insured person dies.",
    monthly: "55 % (large) or 25 % (small) of deceased pension",
    category: "pension",
    authority: "Deutsche Rentenversicherung",
    eligibleIf: [
      "Deceased had 5+ contribution years",
      "Marriage lasted ≥ 1 year (or died from accident)",
      "Children under 18 (27 if in education)",
    ],
    forms: [
      { code: "R0500", title: "Antrag auf Hinterbliebenenrente" },
      { code: "R0660", title: "Anlage Kinder für Waisenrente" },
    ],
    documents: [...ID_DOCS, "Marriage certificate", "Death certificate (Sterbeurkunde)"],
    proofs: ["Deceased's insurance number (Rentenversicherungsnummer)", "School certificate for orphans 18–27"],
  },

  // ---------------- DISABILITY ----------------
  {
    key: "schwerbehindertenausweis",
    name: "Severe Disability ID",
    german: "Schwerbehindertenausweis (GdB ≥ 50)",
    summary: "Official ID granting workplace protection, tax relief and travel discounts.",
    category: "disability",
    authority: "Versorgungsamt / Landesamt für Soziales",
    eligibleIf: [
      "Long-term (> 6 months) impairment",
      "Grad der Behinderung (GdB) of at least 50",
    ],
    forms: [
      { code: "SchwbG-Antrag", title: "Antrag auf Feststellung einer Behinderung" },
      { code: "Verlängerung", title: "Verlängerungsantrag alle 5 Jahre" },
    ],
    documents: [...ID_DOCS, "Passport photo (35×45 mm)"],
    proofs: [
      "All doctor and hospital reports (Befundberichte, Entlassungsbriefe)",
      "Psychological / psychiatric reports if applicable",
      "List of treating doctors with contact details",
    ],
    notes: "Merkzeichen (G, aG, B, H, RF, BI, TBl) unlock additional entitlements — request explicitly.",
  },
  {
    key: "behinderten_pauschbetrag",
    name: "Disability Tax Allowance",
    german: "Behinderten-Pauschbetrag",
    summary: "Fixed tax-free amount (€384–€7,400) based on Grad der Behinderung.",
    category: "tax",
    authority: "Finanzamt",
    eligibleIf: ["Recognised GdB of at least 20", "Documented in Schwerbehindertenausweis or Bescheid"],
    forms: [{ code: "Anlage außergewöhnliche Belastungen", title: "Anlage aB zur Einkommensteuer" }],
    documents: [...ID_DOCS, "Copy of Schwerbehindertenausweis"],
    proofs: ["Feststellungsbescheid Versorgungsamt"],
  },
  {
    key: "blindengeld",
    name: "Blind Persons' Allowance",
    german: "Blindengeld / Landesblindengeld",
    summary: "State allowance for blind or highly visually-impaired people (varies by Bundesland).",
    monthly: "€400–€800 (state-dependent)",
    category: "disability",
    authority: "Landesamt für Soziales / Versorgungsamt",
    eligibleIf: ["Merkzeichen BI (blind) or TBl (deaf-blind)", "Ordinary residence in the Bundesland"],
    forms: [{ code: "Blindengeld-Antrag", title: "Antrag Landesblindengeld" }],
    documents: [...ID_DOCS, "Copy of Schwerbehindertenausweis with Merkzeichen BI/TBl"],
    proofs: ["Augenärztliches Gutachten (ophthalmologist's report)"],
  },
  {
    key: "eingliederungshilfe",
    name: "Disability Integration Support",
    german: "Eingliederungshilfe (SGB IX)",
    summary: "Individualised support to enable participation — assistance, aids, therapies, workshop.",
    category: "disability",
    authority: "Bezirk / Landkreis (Eingliederungshilfeträger)",
    eligibleIf: [
      "Physical, mental or intellectual disability with participation restriction",
      "Support need not covered by other insurance",
    ],
    forms: [{ code: "EGH-Antrag", title: "Antrag auf Leistungen der Eingliederungshilfe" }],
    documents: [...ID_DOCS, "Copy of Schwerbehindertenausweis if any"],
    proofs: [
      "Medical / psychological reports",
      "Bedarfsermittlung (support-needs assessment)",
      "Income & assets proof (contribution assessment)",
    ],
  },

  // ---------------- ILLNESS & REHABILITATION ----------------
  {
    key: "krankengeld",
    name: "Statutory Sick Pay",
    german: "Krankengeld (GKV)",
    summary: "70 % of gross (max 90 % net) from week 7 of continuous illness, up to 78 weeks.",
    monthly: "up to €120 / day",
    category: "illness",
    authority: "Statutory Krankenkasse",
    eligibleIf: [
      "Statutorily insured with Krankengeld entitlement",
      "Certified sick > 6 weeks (after employer's Lohnfortzahlung)",
      "Same diagnosis: 78 weeks within 3 years",
    ],
    forms: [
      { code: "AU-Bescheinigung", title: "Arbeitsunfähigkeitsbescheinigung (elektronisch)" },
      { code: "Krankengeld-Antrag", title: "Antrag & Fragebogen der Krankenkasse" },
    ],
    documents: [...ID_DOCS, "Health insurance card"],
    proofs: ["Continuous AU-Bescheinigungen without gap", "Last payslip for base calculation"],
  },
  {
    key: "verletztengeld",
    name: "Work-Injury Sick Pay",
    german: "Verletztengeld",
    summary: "Sick pay after a work accident or recognised occupational disease (paid by BG).",
    monthly: "up to 80 % of gross earnings",
    category: "illness",
    authority: "Berufsgenossenschaft (BG) / Unfallkasse",
    eligibleIf: [
      "Recognised Arbeitsunfall or Berufskrankheit",
      "Arbeitsunfähig due to that event",
    ],
    forms: [
      { code: "Unfallanzeige", title: "Unfallanzeige (Arbeitgeber)" },
      { code: "D-Arzt-Bericht", title: "Durchgangsarzt-Bericht" },
    ],
    documents: [...ID_DOCS, "Health insurance card"],
    proofs: ["Accident report", "Witness statements", "All medical records"],
  },
  {
    key: "reha",
    name: "Medical Rehabilitation",
    german: "Medizinische Rehabilitation (Reha)",
    summary: "3–6 weeks of inpatient/outpatient rehab paid by DRV or Krankenkasse.",
    category: "illness",
    authority: "Deutsche Rentenversicherung or Krankenkasse",
    eligibleIf: [
      "Chronic illness / after severe treatment",
      "6 months of pension contributions in last 24 months (DRV)",
    ],
    forms: [
      { code: "G0100", title: "Antrag auf Leistungen zur medizinischen Reha (DRV)" },
      { code: "S0050", title: "Selbsteinschätzung" },
      { code: "G0200", title: "Ärztlicher Befundbericht" },
    ],
    documents: [...ID_DOCS, "Rentenversicherungsnummer / Krankenkasse card"],
    proofs: ["Doctor's Befundbericht", "Prior clinic reports"],
  },
  {
    key: "haushaltshilfe",
    name: "Household Help",
    german: "Haushaltshilfe (GKV)",
    summary: "Paid household support when a parent can't run the home due to illness / hospital stay.",
    category: "illness",
    authority: "Krankenkasse",
    eligibleIf: [
      "Illness, hospital or Reha stay of insured person",
      "Child under 12 (or disabled) in household",
      "No adult in household can take over",
    ],
    forms: [{ code: "Haushaltshilfe-Antrag", title: "Antrag Haushaltshilfe der Krankenkasse" }],
    documents: [...ID_DOCS, "Health insurance card"],
    proofs: [
      "Ärztliche Bescheinigung on inability to run household",
      "Proof child lives in household (Meldebescheinigung)",
    ],
  },

  // ---------------- LONG-TERM CARE ----------------
  {
    key: "pflegegrad",
    name: "Care Level Assessment",
    german: "Pflegegrad 1–5 (MDK-Begutachtung)",
    summary: "Assessment that unlocks Pflegegeld, care aids, day-care and residential support.",
    category: "care",
    authority: "Pflegekasse (attached to Krankenkasse)",
    eligibleIf: ["Support need expected > 6 months", "Pre-insurance ≥ 2 of last 10 years"],
    forms: [{ code: "Pflegegrad-Antrag", title: "Antrag auf Leistungen der Pflegeversicherung" }],
    documents: [...ID_DOCS, "List of treating doctors", "Medication plan"],
    proofs: ["Pflegetagebuch (7-day care diary)", "Recent hospital / doctor reports"],
    notes: "MDK visit follows within 25 working days. Prepare the Pflegetagebuch beforehand.",
  },
  {
    key: "pflegegeld",
    name: "Care Allowance (Home Care)",
    german: "Pflegegeld",
    summary: "Cash allowance paid to the insured when family / friends provide the care.",
    monthly: "€347 (PG2) → €990 (PG5)",
    category: "care",
    authority: "Pflegekasse",
    eligibleIf: ["Recognised Pflegegrad 2–5", "Care provided at home (not fully residential)"],
    forms: [{ code: "Pflegegeld-Erklärung", title: "Erklärung zur Auszahlung an Pflegeperson" }],
    documents: [...ID_DOCS, "Pflegegrad-Bescheid"],
    proofs: ["Beratungsbesuch confirmation (every 6 months for PG2/3, 3 months for PG4/5)"],
  },
  {
    key: "verhinderungspflege",
    name: "Substitute Care",
    german: "Verhinderungspflege",
    summary: "Up to 6 weeks / year replacement care when main carer is on holiday or ill.",
    monthly: "up to €1,612 / year (+ Kurzzeitpflege budget)",
    category: "care",
    authority: "Pflegekasse",
    eligibleIf: [
      "Pflegegrad 2–5",
      "Main carer cared at least 6 months already",
    ],
    forms: [{ code: "Verhinderungspflege-Antrag", title: "Antrag Verhinderungspflege" }],
    documents: [...ID_DOCS, "Invoice / receipts of the substitute carer or service"],
    proofs: ["Confirmation from Pflegedienst or private carer"],
  },

  // ---------------- UNEMPLOYMENT ----------------
  {
    key: "arbeitslosengeld1",
    name: "Unemployment Insurance",
    german: "Arbeitslosengeld I (ALG I)",
    summary: "60 % (67 % with child) of last net income for 6–24 months after redundancy.",
    monthly: "up to ≈ €2,900",
    category: "unemployment",
    authority: "Agentur für Arbeit",
    eligibleIf: [
      "12+ months of unemployment insurance in the last 30 months",
      "Registered as arbeitsuchend within 3 days of contract end",
      "Available for at least 15 h/week work",
    ],
    forms: [
      { code: "Alg-Antrag", title: "Antrag auf Arbeitslosengeld (online)" },
      { code: "Arbeitsbescheinigung", title: "Arbeitsbescheinigung des Arbeitgebers" },
    ],
    documents: [...ID_DOCS, "Steuer-ID", "Sozialversicherungsausweis", "Bank account IBAN"],
    proofs: [
      "Kündigung / Aufhebungsvertrag",
      "Payslips of last 12 months",
      "CV & Arbeitszeugnisse",
    ],
    applyUrl: "https://www.arbeitsagentur.de/arbeitslos-arbeit-finden/arbeitslosengeld",
  },

  // ---------------- TAX RELIEFS ----------------
  {
    key: "steuerklassenwechsel",
    name: "Tax Bracket Change",
    german: "Steuerklassenwechsel",
    summary: "Switch classes (III/V, IV/IV or IV + Faktor) to lower monthly wage tax for couples.",
    category: "tax",
    authority: "Finanzamt",
    eligibleIf: ["Married or in registered civil partnership", "Both spouses tax-resident in Germany"],
    forms: [{ code: "Steuerklassenwechsel-Antrag", title: "Antrag Steuerklassenwechsel bei Ehegatten" }],
    documents: [...ID_DOCS, "Marriage certificate (translated)"],
    proofs: ["Latest ELStAM data"],
  },
  {
    key: "kinderfreibetrag",
    name: "Child Tax Allowance",
    german: "Kinderfreibetrag",
    summary: "Tax-free allowance (€9,540 / child in 2026) — Finanzamt applies whichever is more favourable vs Kindergeld.",
    category: "tax",
    authority: "Finanzamt",
    eligibleIf: ["Eligible for Kindergeld", "Filing income-tax return"],
    forms: [{ code: "Anlage Kind", title: "Anlage Kind" }],
    documents: [...ID_DOCS, "Child's Steuer-ID"],
    proofs: ["Kindergeld-Bescheid"],
  },
  {
    key: "pflege_pauschbetrag",
    name: "Care Tax Allowance",
    german: "Pflege-Pauschbetrag",
    summary: "€600–€1,800 / year tax-free for unpaid carers (based on Pflegegrad of the cared-for person).",
    category: "tax",
    authority: "Finanzamt",
    eligibleIf: ["You care for a close relative with Pflegegrad 2–5 unpaid at home"],
    forms: [{ code: "Anlage außergewöhnliche Belastungen", title: "Anlage aB" }],
    documents: [...ID_DOCS, "Cared person's Pflegegrad-Bescheid"],
    proofs: ["Meldebescheinigung showing care at home"],
  },
  {
    key: "doppelte_haushaltsfuehrung",
    name: "Double Household Deduction",
    german: "Doppelte Haushaltsführung",
    summary: "Deduct up to €1,000 / month for a second residence at your workplace.",
    category: "tax",
    authority: "Finanzamt",
    eligibleIf: [
      "Main residence with own household outside workplace city",
      "Second flat at workplace maintained for job reasons",
    ],
    forms: [{ code: "Anlage N", title: "Anlage N — Werbungskosten" }],
    documents: [...ID_DOCS, "Rental contracts of both homes"],
    proofs: ["Monthly rent + utility invoices", "Travel tickets home"],
  },

  // ---------------- SOCIAL INSURANCE / MISC ----------------
  {
    key: "rundfunkbefreiung",
    name: "Broadcasting Fee Exemption",
    german: "Rundfunkbeitrag-Befreiung",
    summary: "Exemption from the €18.36 / month ARD/ZDF/Deutschlandradio fee.",
    monthly: "€18.36 / month saving",
    category: "social_insurance",
    authority: "Beitragsservice ARD ZDF Deutschlandradio",
    eligibleIf: [
      "Recipient of Bürgergeld, Sozialhilfe, BAföG, Wohngeld (+ Kinderzuschlag)",
      "Merkzeichen RF (deaf-blind or severe restriction)",
    ],
    forms: [{ code: "Befreiungsantrag", title: "Antrag auf Befreiung / Ermäßigung" }],
    documents: [...ID_DOCS],
    proofs: ["Current benefit decision (Bescheid) or Schwerbehindertenausweis mit RF"],
    applyUrl: "https://www.rundfunkbeitrag.de",
  },
  {
    key: "sozialversicherungsausweis",
    name: "Social Insurance Number",
    german: "Sozialversicherungsausweis / -nummer",
    summary: "Mandatory number issued once you start work — required by every employer.",
    category: "social_insurance",
    authority: "Deutsche Rentenversicherung (via first employer or Krankenkasse)",
    eligibleIf: ["Starting employment in Germany"],
    forms: [{ code: "Automatisch", title: "Issued automatically on first employment" }],
    documents: [...ID_DOCS],
    proofs: ["Employment contract"],
  },
  {
    key: "krankenversicherung",
    name: "Health Insurance Enrolment",
    german: "Krankenversicherung (GKV / PKV)",
    summary: "Mandatory health insurance — statutory (GKV) or private (PKV) depending on income & status.",
    category: "social_insurance",
    authority: "Krankenkasse or Private Insurer",
    eligibleIf: ["Living in Germany > 3 months", "Employment, self-employment, study or family cover"],
    forms: [
      { code: "GKV-Antrag", title: "Mitgliedsantrag Krankenkasse" },
      { code: "PKV-Antrag", title: "Antrag Private Krankenversicherung" },
    ],
    documents: [...ID_DOCS, "Employment contract or study enrolment", "Previous insurance letter"],
    proofs: ["Income proof (self-employed / high earners)"],
  },
];
