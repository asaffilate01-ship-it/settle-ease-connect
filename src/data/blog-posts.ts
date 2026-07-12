import anmeldung from "@/assets/blog/anmeldung.jpg";
import kindergeld from "@/assets/blog/kindergeld.jpg";
import bereavement from "@/assets/blog/bereavement-first-72h.jpg";
import residence from "@/assets/blog/residence-permit.jpg";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  coverAlt: string;
  author: string;
  publishedAt: string; // ISO
  minutesToRead: number;
  category: "Arrival" | "Family" | "Bereavement" | "Residence";
  /** Rich body as an array of blocks — kept simple so we don't need a MDX toolchain. */
  body: BlogBlock[];
};

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

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
      {
        type: "p",
        text: "The Anmeldung is the single most important thing you'll do in your first two weeks in Germany. Almost every other piece of admin — tax ID, bank account, health insurance, residence permit — starts from your Anmeldebestätigung. Miss the 14-day window and it's a fine; more importantly, it's weeks of downstream delay.",
      },
      { type: "h2", text: "What you'll need" },
      {
        type: "ul",
        items: [
          "Your passport or national ID",
          "A completed Anmeldeformular (we prefill this for you)",
          "The Wohnungsgeberbestätigung — a short landlord confirmation",
          "Marriage and birth certificates for anyone you're registering with you",
        ],
      },
      { type: "h2", text: "Finding an appointment" },
      {
        type: "p",
        text: "Termine in Berlin, Hamburg and Munich vanish within seconds of appearing. Our case managers refresh multiple Bürgeramt calendars for you around the clock and book the first slot you can realistically make. If nothing appears in 14 days, we help you send a written notification so no fine can be issued.",
      },
      { type: "h2", text: "What comes next" },
      {
        type: "p",
        text: "Your Anmeldebestätigung is a single stamped A4 sheet — guard it. Your tax ID will arrive in the post 2–3 weeks later. That's your green light to open a proper current account and finalise your health insurance.",
      },
    ],
  },
  {
    slug: "kindergeld-family-guide",
    title: "Kindergeld: a plain-language guide to Germany's child benefit",
    excerpt:
      "Every child in Germany is entitled to Kindergeld — currently €250 per month. Here's who qualifies, what to submit, and what to do if you've been refused.",
    cover: kindergeld,
    coverAlt: "A parent and small child completing paperwork at a kitchen table",
    author: "Anna Müller",
    publishedAt: "2026-04-12",
    minutesToRead: 5,
    category: "Family",
    body: [
      {
        type: "p",
        text: "Kindergeld is Germany's flat monthly child benefit — €250 per child per month, paid by the Familienkasse regardless of income. It runs until your child is 18, and can extend to 25 if they are still in education or vocational training.",
      },
      { type: "h2", text: "Who qualifies" },
      {
        type: "p",
        text: "You qualify if you (or your partner) live in Germany and are subject to unlimited German income tax, or hold a residence permit that allows you to work. EU citizens qualify automatically. For non-EU citizens the residence-permit category matters — we check yours before submitting the claim.",
      },
      { type: "h2", text: "What you'll need to submit" },
      {
        type: "ul",
        items: [
          "Antrag auf Kindergeld (main form)",
          "Anlage Kind for each child",
          "Your child's Steueridentifikationsnummer and yours",
          "Birth certificate (with sworn translation if not in German)",
          "For older children in education: enrolment or apprenticeship confirmation",
        ],
      },
      { type: "h2", text: "If you're refused" },
      {
        type: "p",
        text: "Most refusals are administrative, not substantive — a missing translation, an unclear residence category, or a mismatched tax ID. You have one month from the refusal letter to lodge a Widerspruch. Don't let that clock run out.",
      },
    ],
  },
  {
    slug: "first-72-hours-after-a-death",
    title: "Losing a loved one in Germany: what to do in the first 72 hours",
    excerpt:
      "A calm, step-by-step guide for families facing a death in Germany — the certificates you need, the deadlines that apply, and the choices you don't have to make alone.",
    cover: bereavement,
    coverAlt: "Two hands holding a single white flower over a folded letter",
    author: "Ismail Yılmaz",
    publishedAt: "2026-04-05",
    minutesToRead: 7,
    category: "Bereavement",
    body: [
      {
        type: "p",
        text: "When someone dies in Germany, the paperwork begins immediately — and much of it has short deadlines. This is a plain-language walk through the first 72 hours, so you know exactly what needs to happen and in what order. Every step below can be done for you or with you by a Beistand case manager, in your language, at any hour.",
      },
      { type: "h2", text: "Hour 0–4: the Totenschein" },
      {
        type: "p",
        text: "A doctor must confirm the death and issue the Totenschein (death certificate). If the death happens at home, call the family doctor or 112. In hospital or a care home, staff will arrange this.",
      },
      { type: "h2", text: "Day 1: contact a funeral director" },
      {
        type: "p",
        text: "In Germany the body may only be moved by a licensed Bestatter. You have some time to choose — you do not have to accept the first funeral director suggested by the hospital or care home. Ask for a written Kostenvoranschlag before you sign anything.",
      },
      { type: "h2", text: "Day 2–3: the Sterbeurkunde" },
      {
        type: "p",
        text: "The Sterbeurkunde (official death certificate) is issued by the local Standesamt within a few working days. You'll need multiple certified copies — banks, insurers, pension providers and the Ausländerbehörde all want their own original.",
      },
      { type: "h2", text: "Within a few days: the funeral" },
      {
        type: "p",
        text: "German law requires burial or cremation within a specific timeframe that varies by state (typically 4 to 10 days). For families needing repatriation abroad — including Islamic Janazah and burial in the country of origin — the paperwork and permits need to start on day one.",
      },
    ],
  },
  {
    slug: "residence-permit-renewal",
    title: "Renewing your Aufenthaltstitel without losing sleep",
    excerpt:
      "Your German residence permit is close to expiring. Here's how to start the renewal early, what happens if the Ausländerbehörde is slow, and how to keep working and travelling in the meantime.",
    cover: residence,
    coverAlt: "A German passport and a blue Aufenthaltstitel residence card on a desk",
    author: "Kateryna Bondar",
    publishedAt: "2026-03-28",
    minutesToRead: 5,
    category: "Residence",
    body: [
      {
        type: "p",
        text: "Renewals are almost always slower than the Ausländerbehörde suggests. The safest rule of thumb is to start six months before expiry. If your permit still expires before your renewal appointment, you're entitled to a Fiktionsbescheinigung — a certificate that keeps your legal status, work permission and (in most cases) travel rights alive until a decision is made.",
      },
      { type: "h2", text: "Start early — and start online" },
      {
        type: "p",
        text: "Most cities now have online booking. Berlin, Munich and Hamburg release slots at set times each week; our case managers watch these queues so you don't have to.",
      },
      { type: "h2", text: "The documents you'll typically need" },
      {
        type: "ul",
        items: [
          "Passport, current residence permit and a recent biometric photo",
          "Meldebescheinigung (address confirmation)",
          "Proof of income and health insurance",
          "For employees: employment contract and recent payslips",
          "For students: enrolment certificate and financial-means proof",
        ],
      },
      { type: "h2", text: "If the appointment lands after your permit expires" },
      {
        type: "p",
        text: "Ask for a Fiktionsbescheinigung. It's not automatic — you have to request it in writing, ideally alongside your renewal application. We do this by default for every family we help.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
