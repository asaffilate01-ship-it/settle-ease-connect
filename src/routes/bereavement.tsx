import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroBereavement from "@/assets/brand/hero-bereavement.jpg";

export const Route = createFileRoute("/bereavement")({
  head: () => ({
    meta: [
      { title: "Bereavement care in Germany — BeistandPlus" },
      { name: "description", content: "Muslim, Christian, Hindu, Sikh and Buddhist end-of-life care coordinated across families, funeral directors, religious organisations and consulates." },
      { property: "og:title", content: "Bereavement care in Germany — BeistandPlus" },
      { property: "og:description", content: "One workflow, every faith, burial in Germany or repatriation abroad." },
    ],
  }),
  component: Bereavement,
});

const homeStages = [
  { t: "Call 112 (unexpected) or Hausarzt (expected)" },
  { t: "Doctor certifies death and issues Todesbescheinigung" },
  { t: "Family opens case in BeistandPlus (60s form)" },
  { t: "Case manager assigned, calls within 15 min" },
  { t: "Digital authority & GDPR consent" },
  { t: "Verified funeral director collects body" },
  { t: "Standesamt registration & certificates" },
  { t: "Ceremony arranged with mosque / church / temple" },
];

const hospitalStages = [
  { t: "Hospital doctor certifies death" },
  { t: "Family notified; hospital notifies BeistandPlus" },
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

const burialOptions = [
  {
    title: "Erdbestattung (earth burial)",
    desc: "Traditional coffin burial in a municipal or confessional cemetery. Grave leases (Nutzungsrecht) typically run 20–30 years and are renewable.",
    tags: ["Friedhofszwang applies", "Coffin required", "Grave lease 20–30 yrs"],
  },
  {
    title: "Feuerbestattung (cremation)",
    desc: "Cremation at a licensed Krematorium after a second confirmatory examination (zweite Leichenschau). Urn must be buried or scattered at a permitted site.",
    tags: ["2nd Leichenschau", "Urn burial required", "€ lower cost"],
  },
  {
    title: "Urnenbeisetzung (urn burial)",
    desc: "Urn interred in an Urnengrab, Urnenwand (columbarium) or anonymous urn field. Selectable in most municipal cemeteries.",
    tags: ["Cemetery only", "Individual or anonymous"],
  },
  {
    title: "Islamic burial (Islamische Bestattung)",
    desc: "Coffinless or minimal-coffin burial in a designated muslimisches Grabfeld, aligned to Qibla, ideally within 24 hours. Available in Berlin, Hamburg, Wuppertal, Frankfurt and a growing list of cities; some Länder (e.g. NRW, Berlin) now permit sargloses Bestatten.",
    tags: ["Qibla-aligned", "Within 24h where possible", "Ghusl + Kafan"],
  },
  {
    title: "Jewish burial (Jüdische Bestattung)",
    desc: "Simple wooden coffin, no cremation, burial in a Jewish cemetery arranged with the Chevra Kadisha of the local Gemeinde.",
    tags: ["No cremation", "Jewish cemetery", "Chevra Kadisha"],
  },
  {
    title: "Hindu / Sikh cremation & ashes",
    desc: "Cremation at a licensed Krematorium with priest / granthi rites at the ceremony hall. Ashes can be interred, sent abroad (e.g. Ganges) with export permit, or scattered at an approved Ruheforst / sea burial site.",
    tags: ["Cremation + rites", "Ashes export possible"],
  },
  {
    title: "Baumbestattung / Ruheforst",
    desc: "Urn burial at the roots of a memorial tree in a licensed forest (Friedwald, Ruheforst). Permitted across Germany.",
    tags: ["Natural burial", "No headstone"],
  },
  {
    title: "Seebestattung (sea burial)",
    desc: "Water-soluble urn released in the North Sea, Baltic Sea or approved international waters via a licensed sea-burial operator.",
    tags: ["Cremation first", "Certificate of position"],
  },
];

const germanRules = [
  { title: "Friedhofszwang", body: "Cemetery obligation: remains and urns must be interred at a licensed site. Home storage or scattering in gardens is not allowed in any Bundesland." },
  { title: "Bestattungsfrist", body: "Burial or cremation must take place within 4–10 days of death — exact window depends on the Bundesland (e.g. Bayern 96h, Berlin 8 days)." },
  { title: "Sargpflicht", body: "Coffin obligation is set at Länder level. NRW, Berlin, Bremen, Hamburg and others now allow shroud-only Islamic burial in designated fields." },
  { title: "Zweite Leichenschau", body: "A second, independent post-mortem is legally required before every cremation." },
  { title: "Bestattungsvorsorge", body: "Prepaid funeral plans (Sterbegeldversicherung, Treuhand) are recognised and honoured — we surface any existing plan during intake." },
  { title: "Sozialbestattung", body: "If the estate cannot cover costs, the Sozialamt covers a würdige Bestattung under §74 SGB XII. We file the application on the family's behalf." },
];

function Bereavement() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

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
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <Badge variant="outline" className="border-primary/30 bg-background/70 text-primary backdrop-blur">
            Bereavement care · 24/7
          </Badge>
          <h1 className="display-hero mt-5 font-semibold leading-[1.05]">
            One call. One case file.<br />
            <span className="italic text-primary">Every person who needs to be involved.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            BeistandPlus coordinates family, funeral director, hospital, Standesamt,
            religious organisation, cemetery, airline, consulate and insurance
            — inside a single, timestamped workflow.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/app/cases/new">Report a death</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/70 backdrop-blur">
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
            <h2 className="display-lg mt-3 font-semibold">
              Bringing your loved one home.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              International repatriation is complex — every destination has
              different requirements. BeistandPlus stores country-specific
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

      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
              Burials & last rites in Germany
            </div>
            <h2 className="display-lg mt-3 font-semibold">
              Every recognised form of burial and cremation, arranged for you.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Germany has strict but well-defined rules — Friedhofszwang,
              Sargpflicht, second post-mortem, fixed burial windows. BeistandPlus
              maps them to your family's tradition and handles the paperwork
              with the Standesamt, cemetery, Krematorium and your religious
              organisation.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {burialOptions.map((b) => (
              <div key={b.title} className="flex flex-col rounded-2xl border border-border/60 bg-parchment/40 p-6 shadow-soft">
                <div className="font-display text-lg font-semibold">{b.title}</div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {b.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] font-medium">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <h3 className="display-md font-semibold">German legal essentials</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {germanRules.map((r) => (
                <div key={r.title} className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="font-semibold">{r.title}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Rules vary by Bundesland. BeistandPlus's assistant applies the
              correct Bestattungsgesetz for the city of death automatically.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Every faith</div>
        <h2 className="display-lg mt-3 font-semibold">
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
      <h3 className="display-md font-semibold">{title}</h3>
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
