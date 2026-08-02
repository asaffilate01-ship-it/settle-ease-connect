import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CheckCircle2, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/benefits")({
  head: () => ({
    meta: [
      { title: "Benefits information — BeistandPlus" },
      {
        name: "description",
        content:
          "Use official sources to check possible benefits and organise the documents and questions for your case.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BenefitsPage,
});

const officialSources = [
  {
    title: "Federal family benefits portal",
    description: "Official information about family-related benefits and responsible services.",
    href: "https://familienportal.de/familienportal/familienleistungen",
  },
  {
    title: "Federal Employment Agency",
    description:
      "Official information and online services for work, unemployment and income support.",
    href: "https://www.arbeitsagentur.de/",
  },
  {
    title: "German Pension Insurance",
    description: "Official pension, rehabilitation and contribution information.",
    href: "https://www.deutsche-rentenversicherung.de/DRV/DE/Home/home_node.html",
  },
];

const preparation = [
  "Name the benefit or decision you want the authority to consider.",
  "Save the current official eligibility page or application instructions.",
  "List household, income, residence and timing facts the authority asks for.",
  "Keep copies of submitted forms, evidence, receipts and reference numbers.",
  "Record only deadlines stated by the authority or a qualified adviser for your case.",
];

function BenefitsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Landmark className="size-5" aria-hidden="true" />
        </div>
        <h1 className="display-lg mt-5 max-w-3xl text-balance font-semibold">
          Check benefits with the responsible official source.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          BeistandPlus does not determine eligibility or calculate an award. Benefit rules, rates
          and evidence requirements can change and depend on details that a short questionnaire
          cannot safely assess. Use the sources below, then organise your case record here.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {officialSources.map((source) => (
          <a
            key={source.href}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:border-primary/40"
          >
            <h2 className="font-display text-xl font-semibold">{source.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {source.description}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Open official site
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </a>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl bg-muted/50 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Case preparation
          </p>
          <h2 className="display-lg mt-3 text-balance font-semibold">
            Build an evidence list, not an eligibility score.
          </h2>
        </div>
        <ul className="space-y-4">
          {preparation.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Organise a benefits case</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a case for documents and follow-up. Submission, advice and representation are
            separate and must be expressly confirmed.
          </p>
        </div>
        <Button asChild className="mt-5 shrink-0 sm:mt-0">
          <Link to="/app/cases/new">
            Create case <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
