import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/bereavement")({
  head: () => ({
    meta: [
      { title: "Bereavement care in Germany — Beistand" },
      { name: "description", content: "Muslim, Christian, Hindu, Sikh and Buddhist end-of-life care coordinated across families, funeral directors, religious organisations and consulates." },
      { property: "og:title", content: "Bereavement care in Germany — Beistand" },
      { property: "og:description", content: "One workflow, every faith, burial in Germany or repatriation abroad." },
    ],
  }),
  component: Bereavement,
});

const homeStages = [
  { t: "Call 112 (unexpected) or Hausarzt (expected)" },
  { t: "Doctor certifies death and issues Todesbescheinigung" },
  { t: "Family opens case in Beistand (60s form)" },
  { t: "Case manager assigned, calls within 15 min" },
  { t: "Digital authority & GDPR consent" },
  { t: "Verified funeral director collects body" },
  { t: "Standesamt registration & certificates" },
  { t: "Ceremony arranged with mosque / church / temple" },
];

const hospitalStages = [
  { t: "Hospital doctor certifies death" },
  { t: "Family notified; hospital notifies Beistand" },
  { t: "Case manager takes over coordination" },
  { t: "Digital authority & GDPR consent" },
  { t: "Handoff from hospital mortuary to funeral director" },
  { t: "Standesamt registration & certificates" },
  { t: "Ceremony or repatriation" },
];

const repatSteps = [
  "Zinc-lined coffin or approved transport casket",
  "Embalming if required by destination country / airline",
  "International transport documentation",
  "Embassy / consulate — repatriation NOC",
  "Airline booking & cargo booking",
  "Customs & export documentation",
  "Receiving funeral director in destination country",
  "Passport handling and family pickup abroad",
];

function Bereavement() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Bereavement care · 24/7
          </Badge>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            One call. One case file. Every person who needs to be involved.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Beistand coordinates family, funeral director, hospital, Standesamt,
            religious organisation, cemetery, airline, consulate and insurance
            — inside a single, timestamped workflow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/app/cases/new">Report a death</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+493012345678">Call our 24/7 line</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <StageCard title="If death is at home" stages={homeStages} tone="primary" />
          <StageCard title="If death is in hospital" stages={hospitalStages} tone="accent" />
        </div>
      </section>

      <section className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Repatriation</div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bringing your loved one home.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              International repatriation is complex — every destination has
              different requirements. Beistand stores country-specific
              checklists and works with consulates on your behalf.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {repatSteps.map((s, i) => (
              <div key={s} className="flex gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-soft">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-warm text-accent-foreground font-display text-lg font-semibold">
                  {i + 1}
                </div>
                <div className="pt-1 text-sm">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Every faith</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Ceremonies handled with respect.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { faith: "Islam", steps: ["Mosque", "Ghusl", "Kafan", "Janazah", "Burial (same day where possible)"] },
            { faith: "Christian", steps: ["Church coordination", "Priest / pastor scheduling", "Service", "Burial or cremation"] },
            { faith: "Hindu", steps: ["Temple coordination", "Priest / pandit scheduling", "Cremation", "Ashes handling"] },
            { faith: "Sikh", steps: ["Gurdwara coordination", "Antim Ardas", "Cremation", "Kirtan Sohila"] },
            { faith: "Buddhist", steps: ["Temple coordination", "Monastic representative", "Cremation", "Memorial services"] },
            { faith: "Non-religious", steps: ["Civil ceremony", "Celebrant coordination", "Cremation or burial", "Personalised service"] },
          ].map((f) => (
            <div key={f.faith} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="font-display text-2xl font-semibold">{f.faith}</div>
              <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
                {f.steps.map((s, i) => (
                  <li key={s}>
                    <span className="mr-2 text-primary">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StageCard({ title, stages, tone }: { title: string; stages: { t: string }[]; tone: "primary" | "accent" }) {
  return (
    <div className={`rounded-3xl border p-8 shadow-soft ${tone === "primary" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60"}`}>
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <ol className="mt-6 space-y-3">
        {stages.map((s, i) => (
          <li key={s.t} className="flex items-start gap-3">
            <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${tone === "primary" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>
              {i + 1}
            </div>
            <div className={tone === "primary" ? "text-primary-foreground/90" : ""}>{s.t}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
