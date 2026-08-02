import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How the workspace works — BeistandPlus" },
      {
        name: "description",
        content:
          "Create a case, organise source documents, review suggested next steps and request available human or professional support.",
      },
      { property: "og:title", content: "How the workspace works — BeistandPlus" },
      {
        property: "og:description",
        content: "A transparent five-step view of the BeistandPlus case workspace.",
      },
      { property: "og:url", content: "https://beistandplus.de/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/how-it-works" }],
  }),
  component: HowItWorks,
});

const steps = [
  {
    title: "Create a case",
    body: "Describe the situation and choose what you want to organise. Avoid adding sensitive information that is not needed.",
  },
  {
    title: "Review the working checklist",
    body: "The workspace can suggest tasks and summarise text. Treat generated content as a draft and verify it against the original source.",
  },
  {
    title: "Store relevant records",
    body: "Keep documents, notes and status updates together. Access is scoped by account, case and assigned role.",
  },
  {
    title: "Request available support",
    body: "Ask for human help or a provider referral where offered. Availability, scope, credentials, fees and engagement terms are confirmed separately.",
  },
  {
    title: "Track the next action",
    body: "Record what was submitted and what the responsible organisation said. Official decisions and deadlines remain authoritative.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How it works
        </p>
        <h1 className="display-hero mt-4 text-balance font-semibold">
          Five steps, with the boundaries made clear.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          BeistandPlus is an organisational workspace. It does not replace an authority, emergency
          service or regulated professional, and no response time or outcome is guaranteed.
        </p>

        <ol className="mt-16 space-y-10">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-5 border-t border-border/60 pt-8 sm:grid-cols-[100px_1fr]"
            >
              <span className="font-display text-4xl font-semibold text-foreground/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="display-md font-semibold">{step.title}</h2>
                <p className="mt-2 text-base leading-7 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Ready to organise your next step?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with the workspace, or review the plan and feature boundaries first.
            </p>
          </div>
          <div className="mt-5 flex shrink-0 flex-wrap gap-3 sm:mt-0">
            <Button asChild>
              <Link to="/app">
                Open workspace <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">Review plans</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
