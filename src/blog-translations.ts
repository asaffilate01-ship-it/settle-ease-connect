import anmeldung from "@/assets/blog/anmeldung.jpg";
import kindergeld from "@/assets/blog/kindergeld.jpg";
import bereavement from "@/assets/blog/bereavement-first-72h.jpg";
import residence from "@/assets/blog/residence-permit.jpg";
import bank from "@/assets/blog/bank-account.jpg";
import health from "@/assets/blog/health-insurance.jpg";
import rental from "@/assets/blog/rental-contract.jpg";
import tax from "@/assets/blog/tax-return.jpg";
import kita from "@/assets/blog/kita-schools.jpg";
import citizenship from "@/assets/blog/citizenship.jpg";

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type PostTranslation = {
  title?: string;
  excerpt?: string;
  coverAlt?: string;
  body?: BlogBlock[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  coverAlt: string;
  author: string;
  publishedAt: string; // ISO
  minutesToRead: number;
  category: "Arrival" | "Family" | "Bereavement" | "Residence" | "Money" | "Health" | "Housing" | "Education" | "Citizenship";
  body: BlogBlock[];
  /** Optional per-locale translations (title, excerpt, body). Missing locales fall back to the default English fields. */
  translations?: Record<string, PostTranslation>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "anmeldung-in-14-days",
    title: "Anmeldung in 14 days: the calm way to register your address",
    excerpt:
      "Every new arrival in Germany has to register their address within 14 days. Here's the paperwork, the appointment tricks, and what to do if you can't find a slot.",
    cover: anmeldung,
    coverAlt: "A young family arriving at a Berlin train station with paperwork",
    author: "Fatima Rehman",
    publishedAt: "2026-04-18",
    minutesToRead: 6,
    category: "Arrival",
    body: [
      { type: "p", text: "The Anmeldung is the single most important thing you'll do in your first two weeks in Germany. Almost every other piece of admin — tax ID, bank account, health insurance, residence permit — starts from your Anmeldebestätigung. Miss the 14-day window and it's a fine; more importantly, it's weeks of downstream delay." },
      { type: "h2", text: "What you'll need" },
      { type: "ul", items: ["Your passport or national ID", "A completed Anmeldeformular (we prefill this for you)", "The Wohnungsgeberbestätigung — a short landlord confirmation", "Marriage and birth certificates for anyone you're registering with you"] },
      { type: "h2", text: "Finding an appointment" },
      { type: "p", text: "Termine in Berlin, Hamburg and Munich vanish within seconds of appearing. Our case managers refresh multiple Bürgeramt calendars for you around the clock and book the first slot you can realistically make. If nothing appears in 14 days, we help you send a written notification so no fine can be issued." },
      { type: "h2", text: "What comes next" },
      { type: "p", text: "Your Anmeldebestätigung is a single stamped A4 sheet — guard it. Your tax ID will arrive in the post 2–3 weeks later. That's your green light to open a proper current account and finalise your health insurance." },
    ],
  },
  {
    slug: "kindergeld-family-guide",
    title: "Kindergeld: a plain-language guide to Germany's child benefit",
    excerpt: "Every child in Germany is entitled to Kindergeld — currently €250 per month. Here's who qualifies, what to submit, and what to do if you've been refused.",
    cover: kindergeld,
    coverAlt: "A parent and small child completing paperwork at a kitchen table",
    author: "Anna Müller",
    publishedAt: "2026-04-12",
    minutesToRead: 5,
    category: "Family",
    body: [
      { type: "p", text: "Kindergeld is Germany's flat monthly child benefit — €250 per child per month, paid by the Familienkasse regardless of income. It runs until your child is 18, and can extend to 25 if they are still in education or vocational training." },
      { type: "h2", text: "Who qualifies" },
      { type: "p", text: "You qualify if you (or your partner) live in Germany and are subject to unlimited German income tax, or hold a residence permit that allows you to work. EU citizens qualify automatically. For non-EU citizens the residence-permit category matters — we check yours before submitting the claim." },
      { type: "h2", text: "What you'll need to submit" },
      { type: "ul", items: ["Antrag auf Kindergeld (main form)", "Anlage Kind for each child", "Your child's Steueridentifikationsnummer and yours", "Birth certificate (with sworn translation if not in German)", "For older children in education: enrolment or apprenticeship confirmation"] },
      { type: "h2", text: "If you're refused" },
      { type: "p", text: "Most refusals are administrative, not substantive — a missing translation, an unclear residence category, or a mismatched tax ID. You have one month from the refusal letter to lodge a Widerspruch. Don't let that clock run out." },
    ],
  },
  {
    slug: "first-72-hours-after-a-death",
    title: "Losing a loved one in Germany: what to do in the first 72 hours",
    excerpt: "A calm, step-by-step guide for families facing a death in Germany — the certificates you need, the deadlines that apply, and the choices you don't have to make alone.",
    cover: bereavement,
    coverAlt: "Two hands holding a single white flower over a folded letter",
    author: "Ismail Yılmaz",
    publishedAt: "2026-04-05",
    minutesToRead: 7,
    category: "Bereavement",
    body: [
      { type: "p", text: "When someone dies in Germany, the paperwork begins immediately — and much of it has short deadlines. This is a plain-language walk through the first 72 hours, so you know exactly what needs to happen and in what order. Every step below can be done for you or with you by a Beistand case manager, in your language, at any hour." },
      { type: "h2", text: "Hour 0–4: the Totenschein" },
      { type: "p", text: "A doctor must confirm the death and issue the Totenschein (death certificate). If the death happens at home, call the family doctor or 112. In hospital or a care home, staff will arrange this." },
      { type: "h2", text: "Day 1: contact a funeral director" },
      { type: "p", text: "In Germany the body may only be moved by a licensed Bestatter. You have some time to choose — you do not have to accept the first funeral director suggested by the hospital or care home. Ask for a written Kostenvoranschlag before you sign anything." },
      { type: "h2", text: "Day 2–3: the Sterbeurkunde" },
      { type: "p", text: "The Sterbeurkunde (official death certificate) is issued by the local Standesamt within a few working days. You'll need multiple certified copies — banks, insurers, pension providers and the Ausländerbehörde all want their own original." },
      { type: "h2", text: "Within a few days: the funeral" },
      { type: "p", text: "German law requires burial or cremation within a specific timeframe that varies by state (typically 4 to 10 days). For families needing repatriation abroad — including Islamic Janazah and burial in the country of origin — the paperwork and permits need to start on day one." },
    ],
  },
  {
    slug: "residence-permit-renewal",
    title: "Renewing your Aufenthaltstitel without losing sleep",
    excerpt: "Your German residence permit is close to expiring. Here's how to start the renewal early, what happens if the Ausländerbehörde is slow, and how to keep working and travelling in the meantime.",
    cover: residence,
    coverAlt: "A German passport and a blue Aufenthaltstitel residence card on a desk",
    author: "Kateryna Bondar",
    publishedAt: "2026-03-28",
    minutesToRead: 5,
    category: "Residence",
    body: [
      { type: "p", text: "Renewals are almost always slower than the Ausländerbehörde suggests. The safest rule of thumb is to start six months before expiry. If your permit still expires before your renewal appointment, you're entitled to a Fiktionsbescheinigung — a certificate that keeps your legal status, work permission and (in most cases) travel rights alive until a decision is made." },
      { type: "h2", text: "Start early — and start online" },
      { type: "p", text: "Most cities now have online booking. Berlin, Munich and Hamburg release slots at set times each week; our case managers watch these queues so you don't have to." },
      { type: "h2", text: "The documents you'll typically need" },
      { type: "ul", items: ["Passport, current residence permit and a recent biometric photo", "Meldebescheinigung (address confirmation)", "Proof of income and health insurance", "For employees: employment contract and recent payslips", "For students: enrolment certificate and financial-means proof"] },
      { type: "h2", text: "If the appointment lands after your permit expires" },
      { type: "p", text: "Ask for a Fiktionsbescheinigung. It's not automatic — you have to request it in writing, ideally alongside your renewal application. We do this by default for every family we help." },
    ],
  },
  {
    slug: "opening-a-german-bank-account",
    title: "Opening a German bank account before your Anmeldung",
    excerpt: "You often need a bank account before you have a registered address — and an address before you can prove your income. Here's how to break that chicken-and-egg loop.",
    cover: bank,
    coverAlt: "A person opening a German bank account on a laptop with a coffee cup nearby",
    author: "Jonas Weber",
    publishedAt: "2026-05-02",
    minutesToRead: 5,
    category: "Money",
    body: [
      { type: "p", text: "Landlords ask for a SCHUFA and a bank statement. Employers ask for an IBAN before your first payday. But most traditional German banks want to see an Anmeldebestätigung before they open a Girokonto. There are three practical routes around this loop." },
      { type: "h2", text: "1. A digital-first bank" },
      { type: "p", text: "N26, Revolut, Bunq and Wise let you open a euro account with just your passport and a selfie. You'll get a working IBAN the same day. Most Berlin and Munich landlords now accept this for the first month's rent and deposit." },
      { type: "h2", text: "2. A basic account (Basiskonto)" },
      { type: "p", text: "Every bank in Germany is legally required to offer a Basiskonto to anyone lawfully in the country — even without an Anmeldung. If you're refused, ask for the refusal in writing; that alone usually reverses it." },
      { type: "h2", text: "3. Switch once your Anmeldung is done" },
      { type: "p", text: "Once you have your registered address and tax ID, upgrade to a full Girokonto with your bank of choice. We help families do this without missing a salary payment." },
    ],
  },
  {
    slug: "public-vs-private-health-insurance",
    title: "Public vs private health insurance: which one actually fits your family",
    excerpt: "Gesetzlich or privat? The decision follows you for years and is hard to reverse. Here's the plain-language version of who saves money where.",
    cover: health,
    coverAlt: "A German health insurance card on a wooden desk next to a stethoscope",
    author: "Dr. Priya Kaur",
    publishedAt: "2026-04-26",
    minutesToRead: 6,
    category: "Health",
    body: [
      { type: "p", text: "Germany's healthcare system runs on two parallel tracks: gesetzliche Krankenversicherung (GKV, public) and private Krankenversicherung (PKV, private). Most new arrivals default to GKV — that's usually the right call, but not always." },
      { type: "h2", text: "GKV in one paragraph" },
      { type: "p", text: "Contributions are a fixed share of your gross salary (around 14.6% + a small Zusatzbeitrag), split with your employer. Your non-earning spouse and children are covered for free. You can switch funds (TK, AOK, Barmer, DAK…) but the price differences are small." },
      { type: "h2", text: "PKV in one paragraph" },
      { type: "p", text: "Premiums are calculated per person based on age and health at signup. Young, single, high earners often pay less than in GKV. Families are almost never cheaper in PKV, because every family member has their own premium." },
      { type: "h2", text: "The rule of thumb" },
      { type: "ul", items: ["Employees earning under €69,300/year → GKV, no choice", "Employees over that threshold, single, healthy, under 35 → PKV can be worth it", "Anyone with a partner and children → GKV is almost always the better long-term choice", "Freelancers and self-employed → run the numbers with us; the answer changes with income volatility"] },
    ],
  },
  {
    slug: "reading-a-german-rental-contract",
    title: "Reading a German rental contract without a lawyer",
    excerpt: "Kaltmiete, Nebenkosten, Staffelmiete, Kündigungsfrist — a short guide to the six clauses that actually matter in a Mietvertrag.",
    cover: rental,
    coverAlt: "A young couple reviewing an apartment rental contract in a bright Berlin flat",
    author: "Lena Schulz",
    publishedAt: "2026-04-20",
    minutesToRead: 6,
    category: "Housing",
    body: [
      { type: "p", text: "A German Mietvertrag can be 20 pages of dense legal German. But almost every dispute we help with comes down to the same six clauses. Read these carefully — the rest is boilerplate." },
      { type: "h2", text: "1. Kaltmiete vs Warmmiete" },
      { type: "p", text: "Kaltmiete is rent for the flat alone. Warmmiete adds Nebenkosten (utilities and building costs). Only Warmmiete tells you what leaves your account each month — always ask which number you're being quoted." },
      { type: "h2", text: "2. Staffelmiete or Indexmiete" },
      { type: "p", text: "A Staffelmiete rises by a fixed amount on set dates. An Indexmiete rises with inflation. If neither clause exists, rent can only rise in narrow legal circumstances. Check which type you're signing." },
      { type: "h2", text: "3. Kaution (deposit)" },
      { type: "p", text: "Capped by law at three months' Kaltmiete. It must be held in a separate interest-bearing account and returned within six months of moving out (minus any documented damage)." },
      { type: "h2", text: "4. Kündigungsfrist (notice period)" },
      { type: "p", text: "For unbefristete (open-ended) contracts, tenants can always give three months' notice. Landlord notice periods grow with tenancy length. Any clause locking you in longer as a tenant is usually void." },
      { type: "h2", text: "5. Schönheitsreparaturen" },
      { type: "p", text: "Cosmetic-repair clauses are the single most litigated part of German tenancy law. Most rigid schedules ('paint every 3 years') are unenforceable. Don't panic on move-out — we review your specific wording." },
      { type: "h2", text: "6. Untermiete and Anmeldung" },
      { type: "p", text: "You have a legal right to register your Anmeldung at the address on your contract. If a landlord refuses to sign the Wohnungsgeberbestätigung, that's a red flag — walk away." },
    ],
  },
  {
    slug: "steuererklaerung-first-time",
    title: "Filing your first Steuererklärung: what you can actually claim back",
    excerpt: "Most employees in Germany get a refund of around €1,100 the first time they file. Here's the calm way to do it without an accountant.",
    cover: tax,
    coverAlt: "A person filling out a German tax return with receipts and a calculator",
    author: "Thomas Becker",
    publishedAt: "2026-05-10",
    minutesToRead: 6,
    category: "Money",
    body: [
      { type: "p", text: "Germany does not automatically refund the tax it over-collects. To get it back you have to file a Steuererklärung — and the average refund for employees is around €1,100. Filing is optional for most employees, but you have four years to look back." },
      { type: "h2", text: "The categories that actually add up" },
      { type: "ul", items: ["Werbungskosten: commuting (€0.30/km, €0.38 after 20km), home office, work equipment", "Sonderausgaben: private pension contributions, church tax, donations", "Außergewöhnliche Belastungen: medical costs above the reasonable threshold", "Handwerkerkosten: 20% of labour costs on home repairs, up to €1,200/year", "Haushaltsnahe Dienstleistungen: cleaners, childcare in your home, elderly-care visits"] },
      { type: "h2", text: "What you actually need" },
      { type: "p", text: "Your Lohnsteuerbescheinigung (year-end payslip), your tax ID, and rough numbers for the categories above. You do not need to send receipts with the return — you keep them and only produce them if the Finanzamt asks." },
      { type: "h2", text: "Deadlines" },
      { type: "p", text: "Voluntary filers have four years. Mandatory filers (freelancers, dual-earner couples on III/V, multiple employers) have until 31 July of the following year — extended if you use a Steuerberater." },
    ],
  },
  {
    slug: "kita-place-and-school-enrolment",
    title: "Getting a Kita place — and enrolling in the right school",
    excerpt: "Kita waiting lists start before your baby is born. School registration has a hard deadline. Here's what to do in each city and what happens if you miss a slot.",
    cover: kita,
    coverAlt: "Children walking to a German Kita nursery with backpacks in autumn",
    author: "Sophia Klein",
    publishedAt: "2026-05-15",
    minutesToRead: 7,
    category: "Education",
    body: [
      { type: "p", text: "Every child in Germany has a legal right to a Kita place from age one — but the right doesn't come with an easy slot. In Berlin, Hamburg, Munich and Frankfurt, families routinely apply to 15–20 Kitas and still start the year unplaced." },
      { type: "h2", text: "The Kita-Gutschein system" },
      { type: "p", text: "Most states run a voucher system. You apply to your local Jugendamt for a Kita-Gutschein specifying the hours you need (e.g. 7h/day), then use that voucher at any Kita with a free place. Berlin's Kita-Navigator and Hamburg's Kita-Datenbank list availability publicly — we monitor them for you." },
      { type: "h2", text: "If nothing appears" },
      { type: "p", text: "The Rechtsanspruch (legal right) is enforceable. If your Jugendamt can't offer a place within a reasonable commute, you can claim compensation for a Tagesmutter or a private Kita. Very few families actually file — but the mere written request usually produces a slot within weeks." },
      { type: "h2", text: "Grundschule enrolment" },
      { type: "p", text: "Children born between 1 July and 30 June of the following school year must be registered at the assigned Grundschule between September and December of the year before they start. Deadlines vary by state — miss them and you may lose choice over which school your child attends." },
    ],
  },
  {
    slug: "german-citizenship-2026",
    title: "The new German citizenship rules — who now qualifies after 3 or 5 years",
    excerpt: "The 2024 citizenship reform is now settled. Dual citizenship is allowed, the residency clock is shorter, and integration criteria are clearer. Here's the current picture.",
    cover: citizenship,
    coverAlt: "Hands holding a German passport and citizenship certificate on a wooden desk",
    author: "Dr. Mehmet Aydın",
    publishedAt: "2026-05-22",
    minutesToRead: 8,
    category: "Citizenship",
    body: [
      { type: "p", text: "The Staatsangehörigkeitsgesetz reform that took effect in June 2024 is now embedded in the day-to-day work of every Einbürgerungsbehörde. Two years in, the picture is much clearer than it was on day one." },
      { type: "h2", text: "The standard track: 5 years" },
      { type: "p", text: "You can apply for German citizenship after five years of lawful residence if you support yourself and your family, have B1 German, pass the Einbürgerungstest, and have no serious criminal record. Dual citizenship is now allowed — you no longer have to renounce your original nationality." },
      { type: "h2", text: "The fast track: 3 years" },
      { type: "p", text: "Special integration achievements shorten the wait to three years: C1 German, strong professional or academic performance, or sustained voluntary work. This route is genuinely being granted — we've helped clients complete it in 2025 and 2026." },
      { type: "h2", text: "What to prepare early" },
      { type: "ul", items: ["Continuous Meldebescheinigung showing five (or three) unbroken years", "Language certificate (B1 or C1) from a recognised provider", "Einbürgerungstest pass certificate", "Tax and pension record confirming self-sufficiency", "Führungszeugnis (police clearance)"] },
      { type: "h2", text: "Realistic timelines" },
      { type: "p", text: "Once submitted, decisions currently take 6–18 months depending on the city. Berlin and Hamburg are the slowest; smaller Länder are dramatically faster. Start collecting documents a year before you plan to file." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/**
 * Return a post with its title/excerpt/body/coverAlt swapped in for the given locale
 * when a translation exists. Locales without a translation fall back to the default
 * English content — the post is never hidden.
 */
import { withTranslations } from "./blog-translations";

export function localizePost(post: BlogPost, locale: string): BlogPost {
  const key = locale?.split("-")[0];
  const merged = withTranslations(post.slug, post.translations);
  const t = key ? merged?.[key] : undefined;
  if (!t) return post;
  return {
    ...post,
    title: t.title ?? post.title,
    excerpt: t.excerpt ?? post.excerpt,
    coverAlt: t.coverAlt ?? post.coverAlt,
    body: t.body ?? post.body,
  };
}
