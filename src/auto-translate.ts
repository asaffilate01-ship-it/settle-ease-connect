export type CaseStage =
  | "reported"
  | "verified"
  | "authority_signed"
  | "collection"
  | "registration"
  | "planning"
  | "ceremony"
  | "closed";

export const stageLabels: Record<CaseStage, string> = {
  reported: "Reported",
  verified: "Verified",
  authority_signed: "Authority signed",
  collection: "Body collection",
  registration: "Standesamt registration",
  planning: "Funeral planning",
  ceremony: "Ceremony",
  closed: "Case closed",
};

export const stageOrder: CaseStage[] = [
  "reported",
  "verified",
  "authority_signed",
  "collection",
  "registration",
  "planning",
  "ceremony",
  "closed",
];

export type FuneralCase = {
  id: string;
  deceasedName: string;
  age: number;
  location: "home" | "hospital";
  city: string;
  religion: "Islam" | "Christian" | "Hindu" | "Sikh" | "Buddhist" | "Other";
  disposition: "burial" | "cremation" | "repatriation";
  destination?: string;
  reportedAt: string;
  caseManager: string;
  familyContact: string;
  phone: string;
  stage: CaseStage;
  urgent?: boolean;
};

export const mockCases: FuneralCase[] = [
  {
    id: "BST-2410-0042",
    deceasedName: "Muhammad Aslam Khan",
    age: 68,
    location: "hospital",
    city: "Berlin",
    religion: "Islam",
    disposition: "repatriation",
    destination: "Lahore, Pakistan",
    reportedAt: "2 hours ago",
    caseManager: "Fatima Rehman",
    familyContact: "Ahmed Khan (son)",
    phone: "+49 151 2345 6789",
    stage: "authority_signed",
    urgent: true,
  },
  {
    id: "BST-2410-0041",
    deceasedName: "Maria Schmidt",
    age: 82,
    location: "home",
    city: "Köln",
    religion: "Christian",
    disposition: "burial",
    reportedAt: "Yesterday",
    caseManager: "Thomas Weber",
    familyContact: "Anna Schmidt (daughter)",
    phone: "+49 160 9988 7766",
    stage: "planning",
  },
  {
    id: "BST-2410-0039",
    deceasedName: "Priya Sharma",
    age: 74,
    location: "hospital",
    city: "München",
    religion: "Hindu",
    disposition: "cremation",
    reportedAt: "3 days ago",
    caseManager: "Fatima Rehman",
    familyContact: "Rohit Sharma (son)",
    phone: "+49 172 4433 2211",
    stage: "ceremony",
  },
  {
    id: "BST-2410-0035",
    deceasedName: "Amjad Hussain",
    age: 71,
    location: "home",
    city: "Frankfurt",
    religion: "Islam",
    disposition: "burial",
    reportedAt: "1 week ago",
    caseManager: "Fatima Rehman",
    familyContact: "Sana Hussain (wife)",
    phone: "+49 176 5544 3322",
    stage: "closed",
  },
];

export type CaseTask = {
  id: string;
  title: string;
  owner: string;
  done: boolean;
  due?: string;
};

export const caseTasksByStage: Record<string, CaseTask[]> = {
  "BST-2410-0042": [
    { id: "t1", title: "Verify membership & insurance", owner: "AI Assistant", done: true },
    { id: "t2", title: "Contact family — introductory call", owner: "Fatima Rehman", done: true },
    { id: "t3", title: "Digital authority & GDPR consent signed", owner: "Family", done: true },
    { id: "t4", title: "Assign funeral director (Berlin)", owner: "Case Manager", done: true, due: "Today" },
    { id: "t5", title: "Collect body from Charité Mitte mortuary", owner: "Furkan Bestattungen", done: false, due: "Today 18:00" },
    { id: "t6", title: "Register death at Standesamt Mitte", owner: "Funeral Director", done: false, due: "Tomorrow" },
    { id: "t7", title: "Ghusl & Kafan at Şehitlik mosque", owner: "Mosque", done: false },
    { id: "t8", title: "Janazah prayer", owner: "Imam Yusuf", done: false },
    { id: "t9", title: "Approved transport casket arrangement", owner: "Furkan Bestattungen", done: false, due: "In 2 days" },
    { id: "t10", title: "Pakistani consulate — repatriation NOC", owner: "AI Assistant", done: false, due: "In 2 days" },
    { id: "t11", title: "Airline cargo booking (Qatar Airways BER→LHE)", owner: "Case Manager", done: false, due: "In 3 days" },
    { id: "t12", title: "Receiving funeral director in Lahore", owner: "Partner network", done: false },
    { id: "t13", title: "Insurance claim submission", owner: "AI Assistant", done: false },
    { id: "t14", title: "Notify pension office & employer", owner: "Family + AI", done: false },
  ],
};

export type Provider = {
  id: string;
  name: string;
  kind: "Islamic funeral" | "Christian funeral" | "Mosque" | "Church" | "Temple" | "Gurdwara" | "Cemetery" | "Hospital" | "Airline" | "Translator" | "Lawyer";
  city: string;
  rating: number;
  verified: boolean;
  langs: string[];
};

export const mockProviders: Provider[] = [
  { id: "p1", name: "Furkan Bestattungen", kind: "Islamic funeral", city: "Berlin", rating: 4.9, verified: true, langs: ["DE", "TR", "AR", "EN"] },
  { id: "p2", name: "Al-Schahbaa Islamische Bestattung", kind: "Islamic funeral", city: "Berlin", rating: 4.8, verified: true, langs: ["DE", "AR", "EN"] },
  { id: "p3", name: "Markaz Funeral Service Berlin", kind: "Islamic funeral", city: "Berlin", rating: 4.7, verified: true, langs: ["DE", "UR", "EN"] },
  { id: "p4", name: "Bestattungen Christian Peter", kind: "Christian funeral", city: "Berlin", rating: 4.9, verified: true, langs: ["DE", "EN"] },
  { id: "p5", name: "Şehitlik-Moschee", kind: "Mosque", city: "Berlin", rating: 4.9, verified: true, langs: ["DE", "TR", "AR"] },
  { id: "p6", name: "Sri Ganesha Hindu Tempel e.V.", kind: "Temple", city: "Berlin", rating: 4.8, verified: true, langs: ["DE", "TA", "HI", "EN"] },
  { id: "p7", name: "Gurudwara Singh Sabha e.V.", kind: "Gurdwara", city: "Berlin", rating: 4.9, verified: true, langs: ["DE", "PA", "EN"] },
  { id: "p8", name: "Charité Mitte — Mortuary", kind: "Hospital", city: "Berlin", rating: 4.6, verified: true, langs: ["DE", "EN"] },
  { id: "p9", name: "Qatar Airways Cargo", kind: "Airline", city: "Frankfurt", rating: 4.7, verified: true, langs: ["EN", "AR"] },
  { id: "p10", name: "Kanzlei Yilmaz — Migrationsrecht", kind: "Lawyer", city: "Köln", rating: 4.8, verified: true, langs: ["DE", "TR", "EN"] },
  { id: "p11", name: "Übersetzungsbüro Rehman", kind: "Translator", city: "Berlin", rating: 4.9, verified: true, langs: ["DE", "UR", "EN", "AR"] },
];

export type { Benefit, BenefitCategory } from "@/data/german-benefits";
export { benefits, CATEGORY_LABEL } from "@/data/german-benefits";


export type ChecklistItem = { id: string; title: string; note?: string; done: boolean };
export type Checklist = { key: string; title: string; description: string; items: ChecklistItem[] };

export const checklists: Checklist[] = [
  {
    key: "anmeldung",
    title: "Address Registration (Anmeldung)",
    description: "The single most important thing to do in your first 14 days.",
    items: [
      { id: "a1", title: "Book Bürgeramt appointment online", done: true },
      { id: "a2", title: "Landlord confirmation (Wohnungsgeberbestätigung)", done: true },
      { id: "a3", title: "Passport + visa", done: true },
      { id: "a4", title: "Rental contract copy", done: false },
      { id: "a5", title: "Anmeldebestätigung received", done: false },
      { id: "a6", title: "Tax ID (Steuer-ID) arrives by post within 2–3 weeks", done: false },
    ],
  },
  {
    key: "arrival",
    title: "First 30 Days in Germany",
    description: "Everything a new arrival must set up.",
    items: [
      { id: "b1", title: "Address registration (Anmeldung)", done: false },
      { id: "b2", title: "Open bank account (N26, DKB, Sparkasse)", done: false },
      { id: "b3", title: "Health insurance (TK, AOK, Barmer)", done: false },
      { id: "b4", title: "Residence permit appointment (Ausländerbehörde)", done: false },
      { id: "b5", title: "SIM card & mobile contract", done: false },
      { id: "b6", title: "Deutschlandticket / transport pass", done: false },
      { id: "b7", title: "Find a Hausarzt (GP)", done: false },
      { id: "b8", title: "School / Kita registration for children", done: false },
      { id: "b9", title: "Utility & internet contracts", done: false },
    ],
  },
  {
    key: "student",
    title: "Student Germany Pack",
    description: "From admission to first semester.",
    items: [
      { id: "s1", title: "University admission letter (Zulassungsbescheid)", done: false },
      { id: "s2", title: "Blocked account (€11,904 / year)", done: false },
      { id: "s3", title: "Student visa application", done: false },
      { id: "s4", title: "Health insurance for students (~€130/month)", done: false },
      { id: "s5", title: "Accommodation (Studentenwerk, WG)", done: false },
      { id: "s6", title: "Anmeldung after arrival", done: false },
      { id: "s7", title: "University enrolment (Immatrikulation)", done: false },
      { id: "s8", title: "Residence permit for study", done: false },
      { id: "s9", title: "Semester ticket & student ID", done: false },
    ],
  },
  {
    key: "residence-permit",
    title: "Residence Permit Timeline",
    description: "Aufenthaltstitel from visa entry through renewal and Niederlassungserlaubnis.",
    items: [
      { id: "rp1", title: "Book Ausländerbehörde Termin (2–6 week wait)", done: false, note: "Berlin.de / abh.hamburg.de / termin.muenchen.de" },
      { id: "rp2", title: "Anmeldung complete before appointment", done: false },
      { id: "rp3", title: "Biometric passport photo (35×45mm)", done: false },
      { id: "rp4", title: "Proof of health insurance (statutory or expat)", done: false },
      { id: "rp5", title: "Proof of purpose (contract, admission, marriage)", done: false },
      { id: "rp6", title: "Proof of livelihood (payslips, Sperrkonto, sponsor)", done: false },
      { id: "rp7", title: "Fiktionsbescheinigung if title expires before appointment", done: false },
      { id: "rp8", title: "Renewal filed at least 8 weeks before expiry", done: false },
      { id: "rp9", title: "Niederlassungserlaubnis eligibility (§9 AufenthG — usually 33/21 months Blue Card, 5y others)", done: false },
    ],
  },
  {
    key: "health-insurance",
    title: "Health Insurance Comparison",
    description: "Pick between statutory (GKV) and private/expat (PKV) — with the switch rules.",
    items: [
      { id: "hi1", title: "Confirm employment status & gross salary vs JAEG (€73,800 in 2025)", done: false },
      { id: "hi2", title: "Statutory shortlist: TK, AOK, Barmer, DAK, hkk", done: false },
      { id: "hi3", title: "Private/expat shortlist: Feather, ottonova, DR-WALTER, Mawista (arrival window only)", done: false },
      { id: "hi4", title: "Compare contribution + Zusatzbeitrag (avg 1.7%)", done: false },
      { id: "hi5", title: "Compare dental, hospital, alternative medicine coverage", done: false },
      { id: "hi6", title: "Check family co-insurance (Familienversicherung) — free in GKV", done: false },
      { id: "hi7", title: "Submit Mitgliedsbescheinigung to employer / Ausländerbehörde", done: false },
      { id: "hi8", title: "Set 18-month review reminder (statutory switch window)", done: false },
    ],
  },
  {
    key: "bank-sim-utilities",
    title: "Bank, SIM & Utility Setup",
    description: "The first-week logistics: money, phone number, electricity, internet.",
    items: [
      { id: "bs1", title: "Open a Girokonto (N26, DKB, Commerzbank, Sparkasse)", done: false, note: "N26/DKB accept many without Anmeldung; Sparkasse usually requires it" },
      { id: "bs2", title: "Complete VideoIdent or Postident", done: false },
      { id: "bs3", title: "Set up SEPA salary deposit + rent standing order", done: false },
      { id: "bs4", title: "Prepaid SIM to bridge (Aldi Talk, Lidl Connect, congstar)", done: false },
      { id: "bs5", title: "Long-term mobile contract after Anmeldung + SCHUFA", done: false },
      { id: "bs6", title: "Electricity contract (Grundversorger auto-active; switch via Verivox/Check24)", done: false },
      { id: "bs7", title: "Gas contract if applicable", done: false },
      { id: "bs8", title: "Internet: DSL/fibre 24-month contract (Telekom, Vodafone, 1&1, o2)", done: false },
      { id: "bs9", title: "Deutsche Post Nachsendeauftrag if moving in-country", done: false },
    ],
  },
  {
    key: "translation",
    title: "Document Translation",
    description: "Beglaubigte Übersetzung for authorities — what needs it and who can do it.",
    items: [
      { id: "tr1", title: "List documents needing certified translation (birth, marriage, diplomas, driving licence)", done: false },
      { id: "tr2", title: "Apostille / legalisation from home country if required", done: false },
      { id: "tr3", title: "Find beeidigter Übersetzer (justiz-dolmetscher.de)", done: false },
      { id: "tr4", title: "Request quote + turnaround (typical 3–7 days, €40–80/page)", done: false },
      { id: "tr5", title: "Provide clear scans + originals for stamp", done: false },
      { id: "tr6", title: "Store translations in vault with expiry notes", done: false },
      { id: "tr7", title: "Anerkennung in Deutschland check for professional qualifications", done: false },
    ],
  },
  {
    key: "appointment-reminders",
    title: "Appointment Reminders",
    description: "Never miss a Termin — Bürgeramt, ABH, doctor, Jobcenter.",
    items: [
      { id: "ar1", title: "Enable push notifications in the app", done: false },
      { id: "ar2", title: "Sync ICS calendar feed to Google / Apple Calendar", done: false },
      { id: "ar3", title: "Add Bürgeramt appointments with 24h + 2h reminders", done: false },
      { id: "ar4", title: "Add Ausländerbehörde appointments", done: false },
      { id: "ar5", title: "Add Krankenkasse / Facharzt appointments", done: false },
      { id: "ar6", title: "Add Jobcenter / Agentur für Arbeit Termine", done: false },
      { id: "ar7", title: "Weekly review of upcoming deadlines with case manager", done: false },
    ],
  },
  {
    key: "housing-pack",
    title: "Housing Application Pack",
    description: "The bundle every landlord asks for — Mietschuldenfreiheitsbescheinigung and beyond.",
    items: [
      { id: "hp1", title: "SCHUFA-BonitätsAuskunft (€29.95) for landlords", done: false },
      { id: "hp2", title: "Last 3 payslips (Gehaltsabrechnungen)", done: false },
      { id: "hp3", title: "Employment contract (Arbeitsvertrag)", done: false },
      { id: "hp4", title: "Passport / Aufenthaltstitel copy", done: false },
      { id: "hp5", title: "Mietschuldenfreiheitsbescheinigung from previous landlord", done: false },
      { id: "hp6", title: "Selbstauskunft form (tenant self-disclosure)", done: false },
      { id: "hp7", title: "WBS application if eligible — see /app/benefits", done: false },
      { id: "hp8", title: "Kaution: 3 cold-rent months escrow or Kautionsbürgschaft", done: false },
      { id: "hp9", title: "Übergabeprotokoll on move-in — photos + meter readings", done: false },
    ],
  },
  {
    key: "rundfunkbeitrag",
    title: "Rundfunkbeitrag Guidance",
    description: "The €18.36/month broadcasting fee — register, exempt or share.",
    items: [
      { id: "rb1", title: "Register household within 4 weeks of Anmeldung (rundfunkbeitrag.de)", done: false },
      { id: "rb2", title: "One fee per household, not per person", done: false },
      { id: "rb3", title: "Check exemption — Bürgergeld, BAföG, disability GdB 80+", done: false },
      { id: "rb4", title: "Submit Befreiungsantrag with proof if exempt", done: false },
      { id: "rb5", title: "Deregister when moving abroad (Abmeldung ans Beitragsservice)", done: false },
      { id: "rb6", title: "Set quarterly payment or SEPA direct debit", done: false },
    ],
  },
  {
    key: "taxid-employment",
    title: "Tax ID & Employment Onboarding",
    description: "Steuer-ID, Sozialversicherung, Lohnsteuerklasse and first payslip check.",
    items: [
      { id: "te1", title: "Steuer-ID arrives 2–3 weeks after Anmeldung", done: false, note: "Reprint via Finanzamt if lost" },
      { id: "te2", title: "Sozialversicherungsnummer (from first employer or DRV)", done: false },
      { id: "te3", title: "Choose Lohnsteuerklasse (I single, III/V or IV/IV for married)", done: false },
      { id: "te4", title: "Provide bank IBAN + Krankenkasse to HR", done: false },
      { id: "te5", title: "Sign Arbeitsvertrag + Probezeit terms", done: false },
      { id: "te6", title: "First payslip check: tax class, church tax, pension deduction", done: false },
      { id: "te7", title: "ELSTER account for annual Steuererklärung", done: false },
      { id: "te8", title: "Add employer to trusted contacts for Bescheinigungen", done: false },
    ],
  },
  {
    key: "driving-licence",
    title: "Driving Licence Conversion",
    description: "Umschreibung of your foreign Führerschein — deadlines, tests, translations.",
    items: [
      { id: "dl1", title: "Confirm home country class (EU/EEA vs third-country Anlage 11)", done: false },
      { id: "dl2", title: "EU/EEA: valid until expiry; Umtausch by 19 Jan 2033", done: false },
      { id: "dl3", title: "Third-country: convert within 6 months of Anmeldung", done: false },
      { id: "dl4", title: "Beglaubigte Übersetzung of licence (ADAC or sworn translator)", done: false },
      { id: "dl5", title: "Sehtest (eye test) at optician (~€7)", done: false },
      { id: "dl6", title: "Erste-Hilfe-Kurs (9 hours)", done: false },
      { id: "dl7", title: "Book theory + practical test at Fahrschule if required", done: false },
      { id: "dl8", title: "Submit Antrag at Führerscheinstelle", done: false },
    ],
  },
  {
    key: "family-reunification",
    title: "Family Reunification (Familiennachzug)",
    description: "Bringing spouse and children to Germany — §§27–36 AufenthG.",
    items: [
      { id: "fr1", title: "Confirm sponsor status: Blue Card, Niederlassung, work permit, refugee", done: false },
      { id: "fr2", title: "Adequate housing proof (Wohnraum ~12 m² per person over 6)", done: false },
      { id: "fr3", title: "Livelihood proof (3 months payslips + employment contract)", done: false },
      { id: "fr4", title: "Spouse A1 German (exemptions for Blue Card, researchers)", done: false },
      { id: "fr5", title: "Marriage certificate — apostille + certified translation", done: false },
      { id: "fr6", title: "Children under 16: no language requirement; 16–17: C1 or integration prognosis", done: false },
      { id: "fr7", title: "National visa (D) at German mission abroad (Vorabzustimmung speeds it up)", done: false },
      { id: "fr8", title: "Ausländerbehörde Vorabzustimmung — 4–6 weeks", done: false },
      { id: "fr9", title: "On arrival: Anmeldung → residence permit → language course", done: false },
    ],
  },
];

export type DocItem = {
  id: string;
  name: string;
  type: "passport" | "visa" | "residence" | "insurance" | "certificate" | "contract" | "other";
  expires?: string;
  size: string;
};

export const mockDocs: DocItem[] = [
  { id: "d1", name: "Reisepass — Ahmed Khan.pdf", type: "passport", expires: "12 Mar 2029", size: "1.2 MB" },
  { id: "d2", name: "Aufenthaltstitel — Blue Card.pdf", type: "residence", expires: "8 Sep 2027", size: "820 KB" },
  { id: "d3", name: "TK Versicherungskarte.jpg", type: "insurance", size: "640 KB" },
  { id: "d4", name: "Anmeldebestätigung Berlin.pdf", type: "certificate", size: "310 KB" },
  { id: "d5", name: "Mietvertrag — Kreuzberg.pdf", type: "contract", size: "2.4 MB" },
  { id: "d6", name: "Geburtsurkunde (übersetzt).pdf", type: "certificate", size: "780 KB" },
];

export type Role = {
  id: string;
  label: string;
  description: string;
  homePath: string;
};

export const roles: Role[] = [
  { id: "family", label: "Family / Member", description: "Report a case, track benefits, store documents", homePath: "/app" },
  { id: "case_manager", label: "Case Manager", description: "Coordinate cases end-to-end", homePath: "/app/cases" },
  { id: "funeral_director", label: "Funeral Director", description: "Receive referrals, upload quotes & invoices", homePath: "/portal/funeral" },
  { id: "mosque", label: "Mosque / Imam", description: "Janazah bookings, imam scheduling", homePath: "/portal/mosque" },
  { id: "church", label: "Church", description: "Funeral services, priest scheduling", homePath: "/portal/church" },
  { id: "temple", label: "Temple / Gurdwara", description: "Ceremony booking", homePath: "/portal/temple" },
  { id: "hospital", label: "Hospital", description: "Death certification, mortuary handoff", homePath: "/portal/hospital" },
  { id: "admin", label: "BeistandPlus Admin", description: "Network oversight & analytics", homePath: "/app" },
];
