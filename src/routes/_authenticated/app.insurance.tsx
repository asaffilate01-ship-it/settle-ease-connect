import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance support — BeistandPlus" },
      {
        name: "description",
        content:
          "Request help understanding insurance options or organising an existing insurance claim.",
      },
    ],
  }),
  component: InsurancePage,
});

const supportOptions = [
  {
    icon: Search,
    title: "Understand your options",
    body: "Tell us what type of cover you are considering. We can help organise your questions before any referral.",
    cta: "Review insurance support",
    to: "/insurance" as const,
  },
  {
    icon: FileText,
    title: "Organise an existing claim",
    body: "Open a case to keep documents, deadlines and correspondence together. Your insurer remains responsible for the claim decision.",
    cta: "Open your cases",
    to: "/app/cases" as const,
  },
  {
    icon: ShieldCheck,
    title: "Ask for human help",
    body: "Contact BeistandPlus if you need help identifying the appropriate next step or an eligible regulated provider.",
    cta: "Contact support",
    to: "/contact" as const,
  },
];

function InsurancePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Insurance support
        </p>
        <h1 className="display-lg mt-3 max-w-3xl text-balance font-semibold">
          A clear place to prepare questions and organise your paperwork.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          BeistandPlus does not provide insurance advice, underwriting, quotations or claim
          decisions. Product availability, price, eligibility and regulatory disclosures must come
          directly from an authorised provider. No provider relationship is implied by this page.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {supportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <article
              key={option.title}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold">{option.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{option.body}</p>
              <Button asChild variant="outline" className="mt-6 justify-between">
                <Link to={option.to}>
                  {option.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </article>
          );
        })}
      </section>

      <aside className="rounded-2xl bg-muted/50 p-6 text-sm leading-6 text-muted-foreground">
        In an emergency, contact the appropriate emergency service or the insurer directly. Do not
        wait for a BeistandPlus response where delay could cause harm, loss of cover or a missed
        deadline.
      </aside>
    </div>
  );
}
