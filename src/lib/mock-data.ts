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
    { id: "t9", title: "Zinc-lined coffin arrangement", owner: "Furkan Bestattungen", done: false, due: "In 2 days" },
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
