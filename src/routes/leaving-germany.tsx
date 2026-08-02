import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  HeartPulse,
  Home,
  Landmark,
  PlaneTakeoff,
  ShieldCheck,
} from "lucide-react";
import { RegulatedNotice } from "@/components/regulated-notice";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaving-germany")({
  head: () => ({
    meta: [
      { title: "Organise a move from Germany — BeistandPlus" },
      {
        name: "description",
        content:
          "A source-led workspace for recording the authorities, documents, confirmations and provider instructions involved in a move from Germany.",
      },
      { property: "og:title", content: "Organise a move from Germany" },
      {
        property: "og:description",
        content:
          "Keep official instructions, documents and follow-up actions together without relying on a generic deadline or eligibility calculator.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/leaving-germany" }],
  }),
  component: LeavingGermany,
});

const SOURCES = [
  {
    icon: Home,
    title: "Residence registration",
    owner: "Federal and local administration portals",
    copy: "Find the service for the municipality where you are registered and follow that authority's current instructions.",
    href: "https://verwaltung.bund.de/leistungsverzeichnis/DE/leistung/99115005070000",
  },
  {
    icon: BriefcaseBusiness,
    title: "Employment and unemployment records",
    owner: "Bundesagentur für Arbeit",
    copy: "Ask the responsible office which notification, record or portability process applies to your circumstances.",
    href: "https://www.arbeitsagentur.de/arbeitslos-arbeit-finden/arbeitslosengeld",
  },
  {
    icon: Landmark,
    title: "Pension record",
    owner: "Deutsche Rentenversicherung",
    copy: "Request information for your own insurance history and destination instead of relying on a general refund assumption.",
    href: "https://www.deutsche-rentenversicherung.de/DRV/DE/Rente/Ausland/ausland_node.html",
  },
  {
    icon: HeartPulse,
    title: "Health cover",
    owner: "Your current insurer and destination-country authority",
    copy: "Obtain written confirmation of the end, continuation or transfer of cover and the date that applies to you.",
    href: "https://www.gkv-spitzenverband.de/krankenversicherung/krankenversicherung.jsp",
  },
  {
    icon: FileText,
    title: "Tax position",
    owner: "Finanzamt or a qualified tax adviser",
    copy: "Confirm filing, residence and cross-border questions for the relevant year and ownership structure.",
    href: "https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/steuern.html",
  },
  {
    icon: Building2,
    title: "Residence status",
    owner: "Ausländerbehörde or BAMF information service",
    copy: "Ask how an absence affects the exact residence document held by each household member before travelling.",
    href: "https://www.bamf.de/DE/Themen/MigrationAufenthalt/migrationaufenthalt-node.html",
  },
] as const;

const WORKFLOW = [
  {
    title: "Record the move facts",
    copy: "Add the intended departure date, destination, household members, current city and the organisations already contacted.",
  },
  {
    title: "Collect current instructions",
    copy: "Save the authority or provider, source link, contact name, reference number, instruction date and any deadline they stated.",
  },
  {
    title: "Keep evidence together",
    copy: "Upload confirmations, forms and correspondence to the case. Mark each item as requested, received or needing follow-up.",
  },
  {
    title: "Confirm dependencies",
    copy: "Check what another organisation needs before acting—for example an authority confirmation, final bill or destination address.",
  },
  {
    title: "Close with a handover",
    copy: "Record unresolved items, future contact details and who remains responsible after the move.",
  },
] as const;

function LeavingGermany() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[oklch(0.18_0.04_240)] text-white">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-accent/15"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
              <PlaneTakeoff className="size-4" aria-hidden /> Moving from Germany
            </div>
            <h1 className="display-hero mt-5 max-w-4xl text-balance font-semibold">
              Organise the move. Keep every official instruction traceable.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/75">
              BeistandPlus gives you one workspace for documents, contacts and follow-up actions.
              The responsible authority, insurer, provider or qualified adviser remains the source
              for your deadline, eligibility and legal position.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
                <Link to="/auth">
                  Open a workspace <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <a href="#official-sources">Check official sources</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Safe workflow
              </div>
              <h2 className="display-lg mt-3 font-semibold">
                A case record, not a generic legal checklist
              </h2>
              <p className="mt-4 text-muted-foreground">
                Rules can depend on the municipality, destination, nationality, household, insurance
                history and tax position. Record what the responsible organisation says for your
                case and when it said it.
              </p>
              <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4 text-primary" aria-hidden /> Before relying on a
                  deadline
                </div>
                <p className="mt-2 text-muted-foreground">
                  Verify it with the responsible organisation, save the source and record the date
                  checked. Do not treat an AI summary, article or checklist as an official decision.
                </p>
              </div>
            </div>
            <ol className="space-y-3">
              {WORKFLOW.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border bg-card p-5 shadow-soft"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="official-sources" className="border-y bg-parchment/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Starting points
              </div>
              <h2 className="display-lg mt-3 font-semibold">
                Go to the organisation responsible for the decision
              </h2>
              <p className="mt-4 text-muted-foreground">
                These links are starting points only. Select the correct municipality, office,
                insurer or adviser and confirm that the information applies to you.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SOURCES.map((source) => {
                const Icon = source.icon;
                return (
                  <a
                    key={source.title}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <ExternalLink
                        className="size-4 text-muted-foreground transition group-hover:text-primary"
                        aria-hidden
                      />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{source.title}</h3>
                    <div className="mt-1 text-xs font-medium text-primary">{source.owner}</div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {source.copy}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
          <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
          <h2 className="display-lg mt-4 font-semibold">Keep the handover calm and complete</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Create a case to organise evidence and follow-up. Provider availability, regulated
            advice, fees, deadlines and outcomes must be confirmed separately.
          </p>
          <Button asChild size="lg" className="mt-7 bg-gradient-primary">
            <Link to="/auth">Create an account</Link>
          </Button>
        </section>
        <RegulatedNotice domain="legal" />
      </main>
      <SiteFooter />
    </div>
  );
}
