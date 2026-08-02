import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { RegulatedNotice } from "@/components/regulated-notice";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/integration-courses")({
  head: () => ({
    meta: [
      { title: "Find official integration-course information — BeistandPlus" },
      {
        name: "description",
        content:
          "Start with current BAMF information, find a nearby course and prepare questions for the responsible authority or provider.",
      },
      { property: "og:title", content: "Integration-course resources — BeistandPlus" },
      {
        property: "og:description",
        content: "A source-led starting point for official BAMF integration-course information.",
      },
      { property: "og:url", content: "https://beistandplus.de/integration-courses" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/integration-courses" }],
  }),
  component: IntegrationCourses,
});

const officialResources = [
  {
    label: "BAMF integration-course overview",
    note: "Current federal overview of course content, participation, costs, rights and examinations.",
    href: "https://www.bamf.de/EN/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/integrationskurse-node.html",
  },
  {
    label: "BAMF participation and costs",
    note: "Check the rules and current application forms for your situation directly with BAMF.",
    href: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/TeilnahmeKosten/teilnahmekosten-node.html",
  },
  {
    label: "BAMF-NAvI local search",
    note: "Search for course providers and advice services near your postcode.",
    href: "https://bamf-navi.bamf.de/",
  },
];

const preparation = [
  "Identify the current residence or citizenship category that may affect participation.",
  "Check whether an authority has already issued an entitlement or obligation document.",
  "Confirm the current fee, exemption rules and travel support with BAMF or the provider.",
  "Ask the provider about placement testing, schedule, accessibility and available childcare.",
  "Keep copies of applications, decisions, receipts and course certificates.",
];

function IntegrationCourses() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Official-source navigator
        </p>
        <h1 className="display-hero mt-4 max-w-4xl text-balance font-semibold">
          Start your integration-course search with BAMF.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          Eligibility, obligations, course formats, fees and forms can change and depend on personal
          circumstances. Use the current federal information below, then confirm your position with
          BAMF, the responsible authority or a course provider.
        </p>

        <section className="mt-12 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          {officialResources.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-5 border-b border-border/60 p-6 transition last:border-b-0 hover:bg-muted/40"
            >
              <span>
                <span className="font-semibold">{resource.label}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {resource.note}
                </span>
              </span>
              <ArrowUpRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
            </a>
          ))}
        </section>

        <section className="mt-14 grid gap-8 rounded-3xl bg-muted/50 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Prepare before applying
            </p>
            <h2 className="display-lg mt-3 text-balance font-semibold">
              Turn official instructions into a personal checklist.
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

        <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Need help organising the paperwork?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              BeistandPlus can help structure your questions and documents. It cannot decide
              eligibility or guarantee admission, funding, a place or an appointment.
            </p>
          </div>
          <Button asChild className="mt-5 shrink-0 sm:mt-0">
            <Link to="/contact">Contact BeistandPlus</Link>
          </Button>
        </section>

        <div className="mt-10">
          <RegulatedNotice domain="education" />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
