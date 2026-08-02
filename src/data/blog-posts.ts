import anmeldung from "@/assets/blog/anmeldung.jpg";
import bereavement from "@/assets/blog/bereavement-first-72h.jpg";
import health from "@/assets/blog/health-insurance.jpg";

export type BlogBlock =
  { type: "p"; text: string } | { type: "h2"; text: string } | { type: "ul"; items: string[] };

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
  publishedAt: string;
  minutesToRead: number;
  category:
    | "Arrival"
    | "Family"
    | "Bereavement"
    | "Residence"
    | "Money"
    | "Health"
    | "Housing"
    | "Education"
    | "Citizenship";
  body: BlogBlock[];
  translations?: Record<string, PostTranslation>;
};

const editorialNotice =
  "This article is general organisational information, not legal, financial, medical, tax or insurance advice. Rules and local processes can change. Confirm requirements, deadlines and eligibility with the responsible authority or an appropriately qualified professional.";

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "prepare-for-a-german-administration-appointment",
    title: "How to prepare for a German administration appointment",
    excerpt:
      "A practical system for checking requirements, organising documents and recording what happens next.",
    cover: anmeldung,
    coverAlt: "A family travelling with an organised document folder",
    author: "BeistandPlus editorial team",
    publishedAt: "2026-08-01",
    minutesToRead: 4,
    category: "Arrival",
    body: [
      { type: "p", text: editorialNotice },
      { type: "h2", text: "Start with the official source" },
      {
        type: "p",
        text: "Use the responsible authority's current website or written appointment notice as your checklist. Check the service, location, accepted document formats, fees and accessibility arrangements. If two sources disagree, ask the authority to confirm in writing.",
      },
      { type: "h2", text: "Build one appointment pack" },
      {
        type: "ul",
        items: [
          "Appointment confirmation and reference number",
          "Identity documents requested by the authority",
          "Completed forms and supporting evidence",
          "Originals, copies and translations where explicitly required",
          "A short list of questions and any access or language needs",
        ],
      },
      { type: "h2", text: "Record the outcome" },
      {
        type: "p",
        text: "After the appointment, save receipts, reference numbers and written instructions together. Note who you spoke with, what was submitted and any next date stated by the authority. Treat your own notes as a memory aid, not as an official decision.",
      },
    ],
  },
  {
    slug: "organise-documents-after-a-bereavement",
    title: "A calm way to organise documents after a bereavement",
    excerpt:
      "Create a simple record of contacts, documents, decisions and deadlines while authoritative professionals handle the formal steps.",
    cover: bereavement,
    coverAlt: "Hands holding a white flower beside an envelope",
    author: "BeistandPlus editorial team",
    publishedAt: "2026-08-01",
    minutesToRead: 5,
    category: "Bereavement",
    body: [
      { type: "p", text: editorialNotice },
      { type: "h2", text: "Deal with immediate safety and care first" },
      {
        type: "p",
        text: "Follow instructions from the attending medical professional, emergency service, care facility or other responsible authority. Local requirements vary, so avoid relying on an unverified online checklist for urgent formalities.",
      },
      { type: "h2", text: "Use a single case record" },
      {
        type: "ul",
        items: [
          "Names and contact details of organisations involved",
          "Documents received and where originals are stored",
          "Written quotations and services you have accepted",
          "Questions that need an answer before a decision",
          "Deadlines stated in official letters or contracts",
        ],
      },
      { type: "h2", text: "Share only what is needed" },
      {
        type: "p",
        text: "Bereavement records can contain sensitive identity, health and financial information. Confirm who is requesting each document, why it is needed and how it will be transmitted. Keep copies of what you send and do not share account credentials.",
      },
    ],
  },
  {
    slug: "questions-before-an-insurance-referral",
    title: "Questions to ask before an insurance referral",
    excerpt:
      "Separate general support from regulated advice and make sure the authorised provider supplies the binding information.",
    cover: health,
    coverAlt: "Insurance paperwork beside a stethoscope",
    author: "BeistandPlus editorial team",
    publishedAt: "2026-08-01",
    minutesToRead: 4,
    category: "Health",
    body: [
      { type: "p", text: editorialNotice },
      { type: "h2", text: "Identify who is responsible" },
      {
        type: "p",
        text: "Ask for the provider's legal name, regulatory status and role in the transaction. BeistandPlus does not underwrite insurance or replace the provider's required disclosures, suitability process or policy documents.",
      },
      { type: "h2", text: "Request the binding details" },
      {
        type: "ul",
        items: [
          "Eligibility and any information used to assess it",
          "Premium, payment schedule and possible future changes",
          "Benefits, limits, exclusions and waiting periods",
          "Cancellation rights and complaint routes",
          "Claims process and the documents a claim may require",
        ],
      },
      { type: "h2", text: "Pause before accepting" },
      {
        type: "p",
        text: "Do not treat an estimate, introduction or marketing summary as cover. Review the provider's final documents and ask an appropriately authorised adviser about anything you do not understand before you accept or pay.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function localizePost(post: BlogPost, _locale?: string): BlogPost {
  // Editorial translations are published only after the translated text has
  // completed the same review as the source article.
  return post;
}
