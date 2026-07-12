// German insurance catalog — companies, product lines, and direct portals
// for client onboarding, quote/apply flows, and claim submission.
// Curated from public provider websites (URLs may need periodic review).

export type InsuranceCategory =
  | "health_statutory" // Gesetzliche Krankenversicherung (GKV)
  | "health_private" // Private Krankenversicherung (PKV)
  | "health_supplementary" // Zusatzversicherung
  | "long_term_care" // Pflegeversicherung
  | "life" // Lebensversicherung / Risikoleben
  | "disability" // Berufsunfähigkeit (BU) / Erwerbsunfähigkeit
  | "accident" // Unfallversicherung
  | "liability" // Privathaftpflicht
  | "household" // Hausratversicherung
  | "building" // Wohngebäudeversicherung
  | "legal" // Rechtsschutz
  | "car" // Kfz-Haftpflicht/Kasko
  | "travel" // Reiseversicherung
  | "pet" // Tierkrankenversicherung
  | "pension" // Rürup / Riester / bAV
  | "funeral"; // Sterbegeldversicherung

export type InsuranceProduct = {
  key: string;
  category: InsuranceCategory;
  name: string;
  monthlyFromEur?: number;
  highlights?: string[];
};

export type InsuranceCompany = {
  id: string;
  name: string;
  logoInitials: string;
  website: string;
  supportPhone?: string;
  supportEmail?: string;
  languages: string[]; // ISO codes
  registerUrl: string; // client sign-up / online application
  quoteUrl?: string; // instant quote calculator
  claimUrl: string; // claims portal / form
  claimEmail?: string;
  claimPhone?: string;
  products: InsuranceProduct[];
  brokerPortalUrl?: string; // partner / broker portal for staff
  notes?: string;
};

export const INSURANCE_CATEGORIES: Record<InsuranceCategory, { label: string; description: string }> = {
  health_statutory: { label: "Statutory Health (GKV)", description: "Public health insurance — mandatory below income threshold." },
  health_private: { label: "Private Health (PKV)", description: "Private full-cover health insurance." },
  health_supplementary: { label: "Supplementary Health", description: "Dental, hospital, vision top-ups." },
  long_term_care: { label: "Long-Term Care (Pflege)", description: "Pflegepflichtversicherung + private top-ups." },
  life: { label: "Life", description: "Term life & whole life policies." },
  disability: { label: "Disability (BU)", description: "Berufsunfähigkeit — income protection." },
  accident: { label: "Accident", description: "Private Unfallversicherung." },
  liability: { label: "Personal Liability", description: "Privathaftpflicht — legally strongly recommended." },
  household: { label: "Household Contents", description: "Hausratversicherung — theft, fire, water damage." },
  building: { label: "Building", description: "Wohngebäudeversicherung for owners." },
  legal: { label: "Legal Protection", description: "Rechtsschutzversicherung." },
  car: { label: "Motor / Kfz", description: "Haftpflicht, Teilkasko, Vollkasko." },
  travel: { label: "Travel", description: "Reisekranken- & Reiserücktritt." },
  pet: { label: "Pet Health", description: "Tierkranken- & OP-Versicherung." },
  pension: { label: "Pension / Retirement", description: "Rürup, Riester, betriebliche Altersvorsorge." },
  funeral: { label: "Funeral Cover (Sterbegeld)", description: "Pre-funded funeral expense cover." },
};

export const INSURANCE_COMPANIES: InsuranceCompany[] = [
  {
    id: "tk",
    name: "Techniker Krankenkasse (TK)",
    logoInitials: "TK",
    website: "https://www.tk.de",
    supportPhone: "+49 800 285 85 85",
    languages: ["de", "en", "tr", "ru"],
    registerUrl: "https://www.tk.de/techniker/service/leistungen-beantragen/mitglied-werden-2005390",
    quoteUrl: "https://www.tk.de/techniker/tk-beitragsrechner",
    claimUrl: "https://www.tk.de/tk-app",
    claimEmail: "service@tk.de",
    brokerPortalUrl: "https://firmenkundenportal.tk.de/",
    products: [
      { key: "tk-gkv", category: "health_statutory", name: "TK Krankenversicherung", monthlyFromEur: 0, highlights: ["Zusatzbeitrag 1.2%", "English hotline", "Fully online sign-up"] },
      { key: "tk-pflege", category: "long_term_care", name: "Pflegepflichtversicherung", highlights: ["Automatic with GKV"] },
    ],
  },
  {
    id: "aok",
    name: "AOK",
    logoInitials: "AOK",
    website: "https://www.aok.de",
    supportPhone: "0800 265 5000",
    languages: ["de", "en", "tr"],
    registerUrl: "https://www.aok.de/pk/mitglied-werden/",
    claimUrl: "https://www.aok.de/pk/servicecenter/",
    products: [
      { key: "aok-gkv", category: "health_statutory", name: "AOK Krankenversicherung", highlights: ["Regional plans", "Bonus programme"] },
    ],
  },
  {
    id: "barmer",
    name: "BARMER",
    logoInitials: "BM",
    website: "https://www.barmer.de",
    supportPhone: "0800 333 1010",
    languages: ["de", "en"],
    registerUrl: "https://www.barmer.de/mitglied-werden",
    claimUrl: "https://www.barmer.de/service/kontakt",
    products: [{ key: "barmer-gkv", category: "health_statutory", name: "BARMER GKV", highlights: ["Teledoktor 24/7"] }],
  },
  {
    id: "dak",
    name: "DAK-Gesundheit",
    logoInitials: "DAK",
    website: "https://www.dak.de",
    languages: ["de", "en", "tr"],
    registerUrl: "https://www.dak.de/dak/mitglied-werden/mitgliedschaftsantrag-2090608.html",
    claimUrl: "https://www.dak.de/dak/leistungen/leistungen-online-beantragen-2094254.html",
    products: [{ key: "dak-gkv", category: "health_statutory", name: "DAK GKV", highlights: ["Wide clinic network"] }],
  },
  {
    id: "allianz",
    name: "Allianz",
    logoInitials: "AZ",
    website: "https://www.allianz.de",
    supportPhone: "0800 4 100 108",
    languages: ["de", "en"],
    registerUrl: "https://www.allianz.de/gesundheit/private-krankenversicherung/",
    quoteUrl: "https://www.allianz.de/rechner/",
    claimUrl: "https://www.allianz.de/service/schaden-melden/",
    claimPhone: "0800 111 22 44",
    brokerPortalUrl: "https://makler.allianz.de/",
    products: [
      { key: "az-pkv", category: "health_private", name: "PrivatMed", monthlyFromEur: 320, highlights: ["Single/family/BEA tariffs"] },
      { key: "az-bu", category: "disability", name: "Berufsunfähigkeitsversicherung", monthlyFromEur: 55, highlights: ["Income protection to age 67"] },
      { key: "az-haft", category: "liability", name: "Privathaftpflicht", monthlyFromEur: 4, highlights: ["50 Mio € cover"] },
      { key: "az-kfz", category: "car", name: "Kfz-Versicherung", highlights: ["Haftpflicht + Kasko"] },
      { key: "az-leben", category: "life", name: "RiesterRente / Lebensversicherung", highlights: ["Multiple tarif options"] },
    ],
  },
  {
    id: "axa",
    name: "AXA",
    logoInitials: "AX",
    website: "https://www.axa.de",
    supportPhone: "0221 148 22 200",
    languages: ["de", "en", "fr"],
    registerUrl: "https://www.axa.de/site/produktabschluesse",
    quoteUrl: "https://www.axa.de/berufsunfaehigkeit/rechner",
    claimUrl: "https://www.axa.de/service/schaden-melden",
    products: [
      { key: "axa-bu", category: "disability", name: "AXA BU-Schutz", monthlyFromEur: 48, highlights: ["Rated 'sehr gut' by Franke & Bornberg"] },
      { key: "axa-haus", category: "household", name: "Hausrat", monthlyFromEur: 5 },
      { key: "axa-leben", category: "life", name: "Risikolebensversicherung", monthlyFromEur: 8 },
    ],
  },
  {
    id: "huk",
    name: "HUK-COBURG",
    logoInitials: "HK",
    website: "https://www.huk.de",
    supportPhone: "09561 96 101",
    languages: ["de"],
    registerUrl: "https://www.huk.de/versicherungen.html",
    quoteUrl: "https://www.huk.de/kfz-versicherung/beitragsrechner.html",
    claimUrl: "https://www.huk.de/service/schadenmeldung.html",
    products: [
      { key: "huk-kfz", category: "car", name: "Kfz-Versicherung", monthlyFromEur: 20, highlights: ["Cheapest large motor insurer"] },
      { key: "huk-haft", category: "liability", name: "Privathaftpflicht", monthlyFromEur: 3 },
      { key: "huk-rechts", category: "legal", name: "Rechtsschutz", monthlyFromEur: 12 },
    ],
  },
  {
    id: "ergo",
    name: "ERGO",
    logoInitials: "EG",
    website: "https://www.ergo.de",
    supportPhone: "0800 3746 925",
    languages: ["de", "en", "tr"],
    registerUrl: "https://www.ergo.de/de/Produkte",
    claimUrl: "https://www.ergo.de/de/Service/Schaden-melden",
    products: [
      { key: "ergo-rechts", category: "legal", name: "Rechtsschutzversicherung", monthlyFromEur: 15 },
      { key: "ergo-reise", category: "travel", name: "Reiseversicherung", monthlyFromEur: 2 },
      { key: "ergo-sterbe", category: "funeral", name: "Sterbegeldversicherung", monthlyFromEur: 10, highlights: ["Cover €3k–€20k"] },
    ],
  },
  {
    id: "debeka",
    name: "Debeka",
    logoInitials: "DB",
    website: "https://www.debeka.de",
    supportPhone: "0261 4980",
    languages: ["de"],
    registerUrl: "https://www.debeka.de/produkte/",
    claimUrl: "https://www.debeka.de/service/schaden-leistung/",
    products: [
      { key: "deb-pkv", category: "health_private", name: "Private Krankenversicherung", monthlyFromEur: 280, highlights: ["Top for Beamte"] },
      { key: "deb-pflege", category: "long_term_care", name: "PflegeErgänzung", monthlyFromEur: 15 },
    ],
  },
  {
    id: "hansemerkur",
    name: "HanseMerkur",
    logoInitials: "HM",
    website: "https://www.hansemerkur.de",
    languages: ["de", "en"],
    registerUrl: "https://www.hansemerkur.de/reiseversicherung",
    claimUrl: "https://www.hansemerkur.de/service/schadenmeldung",
    products: [
      { key: "hm-reise", category: "travel", name: "Reisekrankenversicherung", monthlyFromEur: 1, highlights: ["Best-in-class travel cover"] },
      { key: "hm-inc", category: "health_supplementary", name: "Zahnzusatz", monthlyFromEur: 12 },
    ],
  },
  {
    id: "getsafe",
    name: "Getsafe",
    logoInitials: "GS",
    website: "https://www.getsafe.de",
    languages: ["de", "en"],
    registerUrl: "https://www.getsafe.de/en/",
    quoteUrl: "https://app.getsafe.de/",
    claimUrl: "https://help.getsafe.de/en/collections/2000000-claims",
    products: [
      { key: "gs-haft", category: "liability", name: "Personal Liability", monthlyFromEur: 3, highlights: ["100% app, English"] },
      { key: "gs-haus", category: "household", name: "Contents", monthlyFromEur: 4 },
      { key: "gs-dental", category: "health_supplementary", name: "Dental", monthlyFromEur: 9 },
      { key: "gs-pet", category: "pet", name: "Pet", monthlyFromEur: 10 },
    ],
    notes: "Digital-native, fully English customer journey — ideal for expats.",
  },
  {
    id: "feather",
    name: "Feather Insurance",
    logoInitials: "FE",
    website: "https://feather-insurance.com",
    languages: ["de", "en"],
    registerUrl: "https://feather-insurance.com/",
    claimUrl: "https://feather-insurance.com/claims",
    products: [
      { key: "fe-pkv", category: "health_private", name: "Expat Health", monthlyFromEur: 110 },
      { key: "fe-haft", category: "liability", name: "Liability", monthlyFromEur: 3 },
      { key: "fe-rechts", category: "legal", name: "Legal", monthlyFromEur: 14 },
      { key: "fe-dental", category: "health_supplementary", name: "Dental", monthlyFromEur: 10 },
      { key: "fe-life", category: "life", name: "Life", monthlyFromEur: 12 },
    ],
    notes: "English-first broker + policy portal, popular with newcomers.",
  },
  {
    id: "ottonova",
    name: "ottonova",
    logoInitials: "ON",
    website: "https://www.ottonova.de",
    languages: ["de", "en"],
    registerUrl: "https://www.ottonova.de/en/private-health-insurance",
    quoteUrl: "https://www.ottonova.de/en/rechner",
    claimUrl: "https://www.ottonova.de/en/app",
    products: [
      { key: "on-pkv", category: "health_private", name: "Digital PKV", monthlyFromEur: 250, highlights: ["English app", "Concierge doctor"] },
    ],
  },
  {
    id: "agila",
    name: "AGILA",
    logoInitials: "AG",
    website: "https://www.agila.de",
    languages: ["de"],
    registerUrl: "https://www.agila.de/hundekrankenversicherung",
    claimUrl: "https://www.agila.de/service/schaden-melden",
    products: [
      { key: "ag-pet", category: "pet", name: "Hunde-/Katzenkrankenversicherung", monthlyFromEur: 15 },
    ],
  },
];

// --- Claims process --------------------------------------------------------

export type ClaimStep = {
  step: number;
  title: string;
  detail: string;
  required?: string[]; // documents/proofs
};

export const CLAIM_PROCESS: Record<InsuranceCategory, ClaimStep[]> = {
  health_statutory: [
    { step: 1, title: "Report to your Krankenkasse", detail: "Login to the insurer's app/portal within 7 days of treatment.", required: ["Insurance card (eGK)", "Doctor invoice / receipts"] },
    { step: 2, title: "Submit prescriptions & bills", detail: "Upload PDFs or post originals to the Erstattungsstelle." },
    { step: 3, title: "Await Bescheid", detail: "Approval/rejection within 3–5 weeks. Reimbursement paid to bank account on file." },
    { step: 4, title: "Appeal (Widerspruch)", detail: "1 month deadline to file written objection if rejected.", required: ["Bescheid copy", "Medical justification"] },
  ],
  health_private: [
    { step: 1, title: "Pay bill upfront", detail: "PKV usually requires you to pay the doctor/hospital first, then claim back." },
    { step: 2, title: "Upload receipts", detail: "Use insurer app to scan Arztrechnung + Rezept.", required: ["Arztrechnung (GOÄ)", "Prescription", "Diagnosis code"] },
    { step: 3, title: "Erstattung", detail: "Reimbursed in 1–3 weeks to your bank account." },
  ],
  health_supplementary: [
    { step: 1, title: "Get GKV reimbursement first", detail: "Statutory pays its share; the top-up covers the gap." },
    { step: 2, title: "Submit Restbetrag", detail: "Upload original bill + GKV settlement letter." },
  ],
  long_term_care: [
    { step: 1, title: "Apply for Pflegegrad", detail: "Call Pflegekasse — MDK / Medicproof visits within 25 working days." },
    { step: 2, title: "Receive Bescheid", detail: "Pflegegrad 1–5 determines monthly Pflegegeld / Sachleistung." },
    { step: 3, title: "Monthly claims", detail: "Care services invoice the Pflegekasse directly; family submits Pflegegeld receipts." },
  ],
  life: [
    { step: 1, title: "Notify insurer", detail: "Beneficiary contacts the company with policy number." },
    { step: 2, title: "Submit documents", detail: "Provide certified death certificate, will/inheritance certificate, policy.", required: ["Death certificate", "Erbschein / Testament", "Policy contract", "Beneficiary ID"] },
    { step: 3, title: "Payout", detail: "Sum insured paid to beneficiary within 2–6 weeks after complete file." },
  ],
  disability: [
    { step: 1, title: "Report inability to work", detail: "Notify insurer within contractual deadline (often 3 months)." },
    { step: 2, title: "Complete BU-Fragebogen", detail: "Detailed questionnaire on occupation, medical history.", required: ["Medical reports", "Employer job description", "Tax returns (last 3 years)"] },
    { step: 3, title: "Medical review", detail: "Insurer commissions Gutachter (independent assessor)." },
    { step: 4, title: "Monthly BU pension", detail: "Paid until recovery or contract end age." },
  ],
  accident: [
    { step: 1, title: "Notify within 48h", detail: "Report accident with location, witnesses, injury description." },
    { step: 2, title: "Medical proof", detail: "Submit doctor's report with Invaliditätsgrad (disability %)." },
    { step: 3, title: "Lump-sum payment", detail: "Progression tables determine payout based on disability %." },
  ],
  liability: [
    { step: 1, title: "Never admit fault to victim", detail: "Refer them to your Haftpflicht immediately." },
    { step: 2, title: "File Schadenmeldung", detail: "Insurer investigates and either pays valid claim or defends unfounded one." },
  ],
  household: [
    { step: 1, title: "Secure the scene", detail: "Police report for theft/burglary within 24h." },
    { step: 2, title: "Document damage", detail: "Photos, receipts, list of items with values.", required: ["Police report", "Purchase receipts", "Photos"] },
    { step: 3, title: "Repair/replacement", detail: "Insurer reimburses replacement value (Neuwert)." },
  ],
  building: [
    { step: 1, title: "Emergency mitigation", detail: "Prevent further damage; insurer covers cost." },
    { step: 2, title: "Expert (Gutachter) visit", detail: "For losses >€2k the insurer sends an assessor." },
    { step: 3, title: "Renovation payout", detail: "Paid to contractor invoices or to owner on completion." },
  ],
  legal: [
    { step: 1, title: "Deckungsanfrage", detail: "Request coverage confirmation BEFORE hiring lawyer." },
    { step: 2, title: "Choose lawyer", detail: "Free lawyer choice; insurer pays fees per RVG." },
    { step: 3, title: "Ongoing case management", detail: "Insurer covers court costs, opposing party fees if lost." },
  ],
  car: [
    { step: 1, title: "Accident report at scene", detail: "European accident statement (Europäischer Unfallbericht), photos, witness contacts." },
    { step: 2, title: "Notify within 7 days", detail: "Report to your Kfz insurer with report + photos." },
    { step: 3, title: "Repair", detail: "Free choice of workshop; insurer settles directly or reimburses." },
    { step: 4, title: "SF-Klasse impact", detail: "Haftpflicht claim resets no-claims bonus; Kasko affects Kasko SF." },
  ],
  travel: [
    { step: 1, title: "Save all receipts abroad", detail: "Medical bills, cancellation invoices, taxi transfers." },
    { step: 2, title: "Submit within 1 month of return", detail: "Upload scans via portal.", required: ["Original bills", "Cancellation reason proof", "Booking confirmation"] },
  ],
  pet: [
    { step: 1, title: "Vet treatment", detail: "Pay vet directly (usually)." },
    { step: 2, title: "Submit Rechnung", detail: "Include diagnosis, GOT invoice, treatment plan." },
    { step: 3, title: "Reimbursement", detail: "Paid at contract %  (usually 80–100%) minus deductible." },
  ],
  pension: [
    { step: 1, title: "Retirement age reached", detail: "Notify insurer 6 months before desired payout start." },
    { step: 2, title: "Choose payout form", detail: "Monthly pension vs partial lump-sum (up to 30%)." },
    { step: 3, title: "Monthly payments", detail: "Paid lifelong; tax as Sonstige Einkünfte." },
  ],
  funeral: [
    { step: 1, title: "Beneficiary notifies insurer", detail: "Bring death certificate + policy number." },
    { step: 2, title: "Rapid payout", detail: "Sum insured (typically €3–20k) paid to beneficiary within 5–10 days." },
    { step: 3, title: "Use funds for funeral", detail: "Beneficiary pays funeral director directly; unused balance kept." },
  ],
};

// --- Invoice model ---------------------------------------------------------

export type InvoiceLine = {
  label: string;
  amount: number; // positive = charge, negative = credit
  category?: "premium" | "fee" | "third_party" | "commission" | "tax" | "payout" | "refund";
  note?: string;
};

export function computeInvoice(lines: InvoiceLine[]) {
  const gross = lines.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const credits = lines.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);
  const commission = lines.filter((l) => l.category === "commission").reduce((s, l) => s + l.amount, 0);
  const tax = lines.filter((l) => l.category === "tax").reduce((s, l) => s + l.amount, 0);
  const clientTotal = gross + credits; // credits are negative
  const payoutToBeneficiary = -lines.filter((l) => l.category === "payout").reduce((s, l) => s + l.amount, 0);
  const balanceDue = clientTotal - payoutToBeneficiary;
  return { gross, credits, commission, tax, clientTotal, payoutToBeneficiary, balanceDue };
}
