import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Icon3D, type Icon3DName } from "@/components/icon3d";
import { RegulatedNotice } from "@/components/regulated-notice";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Support areas — BeistandPlus" },
      {
        name: "description",
        content:
          "Explore the administrative organisation, case workspace and referral support BeistandPlus is designed to provide.",
      },
      { property: "og:title", content: "Support areas — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Administrative organisation and referral preparation, with clear professional boundaries.",
      },
      { property: "og:url", content: "https://beistandplus.de/services" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/services" }],
  }),
  component: Services,
});

type SupportArea = {
  icon: Icon3DName;
  title: string;
  summary: string;
  examples: string[];
};

const supportAreas: SupportArea[] = [
  {
    icon: "settlement",
    title: "Administrative organisation",
    summary:
      "Create a structured record of questions, official instructions, documents and next actions.",
    examples: ["Task checklist", "Document record", "Appointment notes"],
  },
  {
    icon: "government",
    title: "Case workspace",
    summary:
      "Keep messages, status changes and files together with access limited to the people assigned to the case.",
    examples: ["Scoped access", "Activity history", "Status tracking"],
  },
  {
    icon: "experts",
    title: "Referral preparation",
    summary:
      "Prepare a concise brief for a provider. Availability and any engagement are confirmed separately.",
    examples: ["Consent capture", "Provider handoff", "Terms recorded separately"],
  },
  {
    icon: "healthcare",
    title: "Insurance and health navigation",
    summary:
      "Organise questions and paperwork without presenting insurance, medical advice or simulated quotations.",
    examples: ["Question preparation", "Policy document record", "Claim checklist"],
  },
  {
    icon: "legal",
    title: "Language and document support",
    summary:
      "Create plain-language working summaries. Certified translations and professional advice stay with qualified providers.",
    examples: ["Draft summaries", "Terminology notes", "Professional referral request"],
  },
  {
    icon: "burials",
    title: "Bereavement organisation",
    summary:
      "Coordinate a sensitive case record while funeral, legal, financial and insurance decisions remain with the responsible parties.",
    examples: ["Contact log", "Quotation record", "Family access controls"],
  },
];

function Services() {
  return (
    <div className="min-h-screen bg-parchment/40">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Support areas
          </p>
          <h1 className="display-hero mt-5 text-balance font-semibold">
            One calm workspace for complicated administration.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            BeistandPlus is designed to help organise information, tasks and consent-based
            referrals. What is available depends on your plan, location, case and the confirmed
            capacity of any independent provider.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/app">
                Open the workspace <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">Review plans</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {supportAreas.map((area) => (
              <article
                key={area.title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 p-2">
                  <Icon3D name={area.icon} alt="" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">{area.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.summary}</p>
                <ul className="mt-5 space-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  {area.examples.map((example) => (
                    <li key={example} className="flex gap-2">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {example}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10">
            <h2 className="display-lg text-balance font-semibold">
              Know the boundary before you begin.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              The workspace can help you prepare and organise. It does not replace an authority,
              emergency service or appropriately authorised legal, tax, medical, insurance or other
              professional adviser. Never rely on a draft summary for a deadline or regulated
              decision; confirm against the original document and responsible source.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/trust">Read the trust and evidence approach</Link>
            </Button>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <RegulatedNotice domain="legal" />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
