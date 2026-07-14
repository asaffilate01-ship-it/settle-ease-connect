export type PlaybookStep = {
  actor: "client" | "family" | "case_manager" | "lawyer" | "notary" | "medical_admin" | "tax_admin" | "benefits_admin";
  title: string;
  description: string;
  deadlineDays?: number;
  documents?: string[];
};

export type Playbook = {
  slug: string;
  title: string;
  summary: string;
  authoritiesToNotify: string[];
  insurancesToClaim: string[]; // referenced categories from health_insurance / pensions / referral_partners
  documentsRequired: string[];
  steps: PlaybookStep[];
};

export const LIFE_EVENT_PLAYBOOKS: Playbook[] = [
  {
    slug: "death",
    title: "Death of a loved one",
    summary: "End-to-end after-death checklist: registration, benefits, insurance claims, probate.",
    authoritiesToNotify: [
      "Standesamt (register death within 3 working days)",
      "Deutsche Rentenversicherung (statutory pension)",
      "Krankenkasse (health insurance)",
      "Finanzamt (income tax)",
      "Employer HR",
      "Ausländerbehörde (if non-EU)",
      "Bank(s), landlord, utilities, telecom",
    ],
    insurancesToClaim: ["life", "accident", "funeral", "occupational_pension", "private_pension", "widow_pension"],
    documentsRequired: [
      "Death certificate (Sterbeurkunde) — 5–10 certified copies",
      "Birth certificate of deceased",
      "Marriage certificate (if applicable)",
      "Passport / ID of deceased and next of kin",
      "Will (Testament) or Erbschein",
      "Insurance policies and pension statements",
      "Recent payslips / tax returns",
    ],
    steps: [
      { actor: "family", title: "Obtain death certificate", description: "Doctor issues Todesbescheinigung; register at Standesamt to receive Sterbeurkunde.", deadlineDays: 3 },
      { actor: "case_manager", title: "Notify employer and Krankenkasse", description: "Triggers final salary, sickness pay closure, and funeral grant assessment.", deadlineDays: 7 },
      { actor: "benefits_admin", title: "File widow/orphan pension (Hinterbliebenenrente)", description: "Submit R0500 to Deutsche Rentenversicherung.", deadlineDays: 30 },
      { actor: "case_manager", title: "Claim life & accident insurance policies", description: "Package Sterbeurkunde + policies, submit to each insurer.", deadlineDays: 30 },
      { actor: "notary", title: "Open probate (Nachlass)", description: "Erbschein application at Amtsgericht if no notarised will.", deadlineDays: 60 },
      { actor: "tax_admin", title: "File final income tax + inheritance tax", description: "Erbschaftsteuererklärung within 3 months of notification.", deadlineDays: 90 },
    ],
  },
  {
    slug: "serious-illness",
    title: "Serious illness / hospitalisation",
    summary: "Income protection, Krankengeld, employer notifications, care planning.",
    authoritiesToNotify: ["Employer HR (Krankmeldung day 1)", "Krankenkasse (after day 3–7)", "Pflegekasse (if care needed)"],
    insurancesToClaim: ["health", "sick_pay", "disability", "critical_illness", "accident"],
    documentsRequired: ["AU-Bescheinigung (sick note)", "Hospital admission letter", "Payslips (last 3 months)", "Insurance policy numbers"],
    steps: [
      { actor: "client", title: "Submit sick note to employer & Krankenkasse", description: "Day 1 to employer, keep copy for Krankenkasse.", deadlineDays: 1 },
      { actor: "medical_admin", title: "Set up Krankengeld", description: "After 6 weeks of Entgeltfortzahlung, Krankenkasse pays ~70% of gross.", deadlineDays: 42 },
      { actor: "benefits_admin", title: "Assess Berufsunfähigkeit (BU) claim", description: "If long-term inability to work, trigger private BU policy.", deadlineDays: 90 },
    ],
  },
  {
    slug: "work-injury",
    title: "Work injury (Arbeitsunfall)",
    summary: "Berufsgenossenschaft claim, D-Arzt referral, injury pension.",
    authoritiesToNotify: ["Employer (immediately)", "Berufsgenossenschaft (BG)", "Durchgangsarzt (D-Arzt)"],
    insurancesToClaim: ["statutory_accident_insurance", "private_accident", "disability"],
    documentsRequired: ["Unfallanzeige (accident report)", "D-Arzt-Bericht", "Witness statements"],
    steps: [
      { actor: "client", title: "See a D-Arzt within 24h", description: "Only certified accident doctors can open a BG file.", deadlineDays: 1 },
      { actor: "case_manager", title: "File Unfallanzeige with BG", description: "Employer must report within 3 days if >3 days incapacity.", deadlineDays: 3 },
      { actor: "benefits_admin", title: "Track Verletztengeld / Verletztenrente", description: "80% wage compensation → possible permanent pension if MdE ≥ 20%.", deadlineDays: 42 },
    ],
  },
  {
    slug: "redundancy",
    title: "Redundancy / end of service",
    summary: "ALG I registration, severance negotiation, health insurance continuity.",
    authoritiesToNotify: ["Agentur für Arbeit (register jobseeking 3 months before end)", "Krankenkasse", "Finanzamt (tax class)"],
    insurancesToClaim: ["unemployment_alg1", "severance", "occupational_pension_vesting"],
    documentsRequired: ["Termination letter (Kündigung)", "Arbeitszeugnis", "Last 12 payslips", "Lohnsteuerbescheinigung"],
    steps: [
      { actor: "client", title: "Register as jobseeker (arbeitsuchend)", description: "Online at arbeitsagentur.de within 3 days of notice or 3 months before end.", deadlineDays: 3 },
      { actor: "lawyer", title: "Review termination legality", description: "Kündigungsschutzklage must be filed within 3 weeks.", deadlineDays: 21 },
      { actor: "benefits_admin", title: "File ALG I claim on last working day", description: "60–67% of net for 6–24 months depending on age and contributions.", deadlineDays: 0 },
    ],
  },
  {
    slug: "long-term-disability",
    title: "Long-term disability (Berufsunfähigkeit / Erwerbsminderung)",
    summary: "Statutory Erwerbsminderungsrente and private BU claims.",
    authoritiesToNotify: ["Deutsche Rentenversicherung", "Krankenkasse", "Employer HR", "BU insurer"],
    insurancesToClaim: ["disability_bu", "statutory_disability", "critical_illness", "private_pension_waiver"],
    documentsRequired: ["Medical reports (last 2 years)", "Employment history", "BU policy documents"],
    steps: [
      { actor: "medical_admin", title: "Compile medical evidence", description: "GP + specialists, structured to insurer's questionnaire.", deadlineDays: 30 },
      { actor: "benefits_admin", title: "File Erwerbsminderungsrente (R0100)", description: "Statutory partial or full disability pension.", deadlineDays: 60 },
      { actor: "lawyer", title: "BU claim negotiation", description: "Handle insurer objections; sozialgerichtlich if declined.", deadlineDays: 120 },
    ],
  },
  {
    slug: "birth",
    title: "Birth of a child",
    summary: "Registration, Elterngeld, Kindergeld, health insurance.",
    authoritiesToNotify: ["Standesamt (birth registration within 7 days)", "Krankenkasse", "Elterngeldstelle", "Familienkasse (Kindergeld)"],
    insurancesToClaim: ["elterngeld", "mutterschaftsgeld", "kindergeld", "family_health_cover"],
    documentsRequired: ["Geburtsurkunde", "Parents' IDs", "Marriage certificate or Vaterschaftsanerkennung", "Employer confirmation"],
    steps: [
      { actor: "client", title: "Register the birth", description: "Standesamt of the birthplace, within 7 days.", deadlineDays: 7 },
      { actor: "benefits_admin", title: "File Elterngeld (within 3 months of birth)", description: "Up to 65% of net income for 12–14 months.", deadlineDays: 90 },
      { actor: "benefits_admin", title: "File Kindergeld", description: "Familienkasse; ~€250/month per child.", deadlineDays: 30 },
    ],
  },
  {
    slug: "marriage",
    title: "Marriage",
    summary: "Standesamt appointment, tax-class change, insurance updates.",
    authoritiesToNotify: ["Standesamt", "Finanzamt (Lohnsteuerklassenwechsel)", "Krankenkasse", "Employer HR", "Insurers"],
    insurancesToClaim: ["family_health_cover", "spouse_pension_beneficiary"],
    documentsRequired: ["Birth certificates", "Meldebescheinigung", "Passports", "Divorce decree (if applicable)", "Ehefähigkeitszeugnis (foreign)"],
    steps: [
      { actor: "client", title: "Book Standesamt appointment", description: "Anmeldung zur Eheschließung, both partners in person.", deadlineDays: 30 },
      { actor: "tax_admin", title: "Change tax class", description: "III/V or IV/IV via Finanzamt.", deadlineDays: 30 },
      { actor: "case_manager", title: "Update beneficiaries", description: "Life, pension, and accident policies.", deadlineDays: 30 },
    ],
  },
  {
    slug: "divorce",
    title: "Divorce / separation",
    summary: "Court filing, Versorgungsausgleich, tax and insurance updates.",
    authoritiesToNotify: ["Familiengericht", "Finanzamt", "Krankenkasse", "Employer HR"],
    insurancesToClaim: ["pension_split", "health_cover_change"],
    documentsRequired: ["Marriage certificate", "Separation agreement", "Income & asset disclosure", "Pension statements"],
    steps: [
      { actor: "lawyer", title: "File Scheidungsantrag after Trennungsjahr", description: "Mandatory 1-year separation before filing.", deadlineDays: 365 },
      { actor: "benefits_admin", title: "Process Versorgungsausgleich", description: "Pension entitlements split between spouses.", deadlineDays: 180 },
    ],
  },
  {
    slug: "relocation-abroad",
    title: "Leaving Germany for good",
    summary: "Abmeldung, tax farewell (Wegzugsteuer), pension export, contract cancellations, family & pets.",
    authoritiesToNotify: [
      "Bürgeramt (Abmeldung)",
      "Finanzamt (final Steuererklärung + Wegzugsteuer)",
      "Krankenkasse (health-insurance exit + Auslandsanwartschaft)",
      "Deutsche Rentenversicherung (pension export or refund)",
      "Familienkasse (stop Kindergeld)",
      "Rundfunkbeitrag / GEZ",
      "Ausländerbehörde (permit hand-back or re-entry permit)",
      "Employer / clients + Agentur für Arbeit (PD U1 / U2)",
      "Bank(s), landlord, utilities, telecom, insurers",
    ],
    insurancesToClaim: [
      "health_cover_transition",
      "pension_export",
      "pension_refund_non_eu",
      "unemployment_export_u2",
      "occupational_pension_bav",
      "riester_ruerup_portability",
    ],
    documentsRequired: [
      "Abmeldebestätigung (5–10 stamped copies)",
      "Final Steuererklärung + Ansässigkeitsbescheinigung",
      "Krankenkasse Versicherungszeitenbescheinigung + Auslandsanwartschaft (if returning)",
      "Rentenauskunft from Deutsche Rentenversicherung",
      "Arbeitszeugnis + Lohnsteuerbescheinigung from employer",
      "Lease termination + Übergabeprotokoll + landlord forwarding-address confirmation",
      "PD U1 / PD U2 / S1 / A1 forms as applicable",
      "EU pet passport, rabies-titre certificate (if applicable)",
      "Kfz-Abmeldung / export plates confirmation (if applicable)",
    ],
    steps: [
      { actor: "case_manager", title: "Kick-off call: map tax residency, visa, family, property", description: "30-minute triage identifies Wegzugsteuer risk, permit-lapse risk, and cancellation windows.", deadlineDays: -90 },
      { actor: "client", title: "Give notice on lease (Einschreiben mit Rückschein)", description: "Standard 3-month Kündigungsfrist; Sonderkündigungsrecht available on Abmeldung.", deadlineDays: -90 },
      { actor: "tax_admin", title: "Wegzugsteuer screening (§6 AStG)", description: "For >1% shareholders; restructuring options disappear after Abmeldung.", deadlineDays: -60 },
      { actor: "case_manager", title: "Request PD U1 / U2 / S1 / A1 as applicable", description: "Portable social-security rights for EU/EEA/CH moves.", deadlineDays: -45 },
      { actor: "client", title: "Cancel Strom, Gas, Internet, Handy, GEZ, gym, insurances", description: "Bundle cancellations with the Abmeldung date and Sonderkündigungsrecht.", deadlineDays: -30 },
      { actor: "client", title: "Abmeldung at Bürgeramt", description: "Master document; ask for 5–10 stamped copies.", deadlineDays: 14 },
      { actor: "tax_admin", title: "File final Steuererklärung with Wegzugsdatum", description: "Include Ansässigkeitsbescheinigung request for the new country.", deadlineDays: 60 },
      { actor: "benefits_admin", title: "Deutsche Rentenversicherung — export or refund pension", description: "Non-EU citizens with ≥60 months of contributions may claim Beitragsrückerstattung after 24 months abroad.", deadlineDays: 720 },
      { actor: "case_manager", title: "Chase Kaution + final Nebenkostenabrechnung + refunds", description: "Confirmed forwarding address, written release schedule, proxy in Germany if needed.", deadlineDays: 180 },
    ],
  },
];

