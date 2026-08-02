import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  HeartHandshake,
  Plane,
  Scale,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegulatedNotice } from "@/components/regulated-notice";
import heroBereavement from "@/assets/brand/hero-bereavement.jpg";
import { publicLegal } from "@/lib/public-config";

export const Route = createFileRoute("/bereavement")({
  head: () => ({
    meta: [
      { title: "Bereavement guidance and coordination — BeistandPlus" },
      {
        name: "description",
        content:
          "A structured place to organise bereavement tasks, family updates and provider referrals in Germany.",
      },
      { property: "og:title", content: "Bereavement guidance and coordination — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Organise the people, documents and next steps without implying a guaranteed provider or response time.",
      },
      { property: "og:url", content: "https://beistandplus.de/bereavement" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/bereavement" }],
  }),
  component: BereavementPage,
});

const FIRST_STEPS = {
  home: [
    "For an unexpected death or immediate danger, call 112. For an expected death, contact the treating doctor or out-of-hours medical service.",
    "Wait for the doctor or responsible authority to explain when the person may be moved.",
    "Open a BeistandPlus case when you are ready to organise tasks and family updates.",
    "Choose which funeral director, faith contact or other provider you want to approach.",
  ],
  hospital: [
    "Ask the hospital which documents are available and who the family contact is.",
    "Confirm how long the person can remain with the hospital and when a funeral director is needed.",
    "Open a case to record contacts, documents, decisions and deadlines.",
    "Share only the case information each invited family member or provider needs.",
  ],
};

const COORDINATION_AREAS = [
  {
    icon: Users,
    title: "Family and contacts",
    body: "Keep decisions and updates in one case. Family access is explicit, email-bound, expiring and revocable.",
  },
  {
    icon: Scale,
    title: "Documents and local rules",
    body: "Track certificates and tasks. Exact funeral law and deadlines vary by Bundesland and must be confirmed locally.",
  },
  {
    icon: HeartHandshake,
    title: "Faith and cultural preferences",
    body: "Record the ceremony, washing, burial or cremation preferences a chosen provider should understand.",
  },
  {
    icon: Plane,
    title: "International repatriation",
    body: "Organise questions for the funeral director, airline and destination authorities. Requirements are provider- and country-confirmed.",
  },
];

const QUESTIONS = [
  "Who is authorised to make arrangements?",
  "Which doctor, hospital or authority issued the first documents?",
  "Has a funeral director been chosen, or do you want an introduction?",
  "Are there religious, cultural, timing or accessibility preferences?",
  "Will burial or cremation take place in Germany, or is repatriation being considered?",
  "Which family members need updates or limited case access?",
];

function BereavementPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img
              src={heroBereavement}
              alt=""
              aria-hidden
              width={1600}
              height={1000}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
          </div>
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-28 lg:px-8">
            <Badge
              variant="outline"
              className="border-primary/30 bg-background/70 text-primary backdrop-blur"
            >
              Bereavement guidance and case coordination
            </Badge>
            <h1 className="display-hero mt-5 text-balance font-semibold leading-[1.05]">
              One place for the people, documents and decisions.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              BeistandPlus helps organise the workflow. Availability, legal advice, funeral
              services, pricing and response times are confirmed by the relevant authority or
              provider.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
                <Link to="/app/cases/new">Open a bereavement case</Link>
              </Button>
              {publicLegal.supportPhone && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-background/70 backdrop-blur"
                >
                  <a href={`tel:${publicLegal.supportPhone.replace(/\s/g, "")}`}>
                    Call during support hours
                  </a>
                </Button>
              )}
            </div>
            <div className="mx-auto mt-6 flex max-w-2xl items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-left text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
              BeistandPlus is not an emergency service. For immediate danger or an unexpected death,
              call 112.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <StepCard title="If the death is at home" steps={FIRST_STEPS.home} />
            <StepCard title="If the death is in hospital" steps={FIRST_STEPS.hospital} />
          </div>
        </section>

        <section className="bg-parchment/50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Coordination workspace
            </p>
            <h2 className="display-lg mt-3 max-w-3xl text-balance font-semibold">
              Structure the work without assuming the outcome.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COORDINATION_AREAS.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Prepare for the first conversation
            </p>
            <h2 className="display-lg mt-3 text-balance font-semibold">
              Questions worth answering once.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The case workspace helps you keep answers consistent across family members and chosen
              providers.
            </p>
          </div>
          <ul className="space-y-3">
            {QUESTIONS.map((question) => (
              <li
                key={question}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm shadow-soft"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {question}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[oklch(0.16_0.04_250)] px-8 py-12 text-white shadow-elevated">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="display-md font-semibold">Looking for funeral-cover information?</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  BeistandPlus can provide a referral introduction only. A licensed receiving
                  provider confirms eligibility, benefit, exclusions, waiting periods, price and
                  contract terms.
                </p>
              </div>
              <Button asChild className="bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90">
                <Link to="/bereavement-cover">
                  View referral information <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <RegulatedNotice domain="funeral" />
      </main>
      <SiteFooter />
    </div>
  );
}

function StepCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-7 shadow-soft">
      <h2 className="display-md font-semibold">{title}</h2>
      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-sm">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
              {index + 1}
            </span>
            <span className="pt-1 text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
