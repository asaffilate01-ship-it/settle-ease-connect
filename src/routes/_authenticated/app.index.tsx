import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Sparkles, Clock, FileCheck2, HeartHandshake } from "lucide-react";
import { mockCases, stageLabels } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Overview,
});

function Overview() {
  const activeCases = mockCases.filter((c) => c.stage !== "closed");
  const urgent = mockCases.find((c) => c.urgent);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Willkommen zurück</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Ahmed, here's your day.</h1>
        </div>
        <Button asChild className="bg-gradient-primary">
          <Link to="/app/cases/new">
            <HeartHandshake className="mr-1 h-4 w-4" /> Report a case
          </Link>
        </Button>
      </div>

      {urgent && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning/30 text-warning-foreground">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-semibold">Urgent — Case {urgent.id}</div>
              <p className="text-sm text-muted-foreground">
                Body collection scheduled today · Consulate documents due in 2 days · Airline booking pending.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/app/cases/$caseId" params={{ caseId: urgent.id }}>
                Open case <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active cases" value={activeCases.length.toString()} sub="across Berlin & NRW" />
        <Stat label="Tasks due this week" value="9" sub="3 need signature" />
        <Stat label="Benefits identified" value="€1,340" sub="/ month potential" tone="accent" />
        <Stat label="Documents in vault" value="6" sub="2 expire this year" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Active cases</h2>
            <Link to="/app/cases" className="text-sm text-primary">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-border/60">
            {activeCases.map((c) => (
              <Link
                key={c.id}
                to="/app/cases/$caseId"
                params={{ caseId: c.id }}
                className="flex items-center gap-4 py-4 hover:bg-parchment/40 rounded-md px-2 -mx-2 transition-colors"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary font-display font-semibold">
                  {c.deceasedName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{c.deceasedName}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.city} · {c.religion} · {c.disposition}
                    {c.destination ? ` → ${c.destination}` : ""}
                  </div>
                </div>
                <Badge variant="secondary" className="hidden md:inline-flex">
                  {stageLabels[c.stage]}
                </Badge>
                <div className="hidden text-xs text-muted-foreground md:block">{c.reportedAt}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">Beistand AI</div>
              <div className="text-xs text-muted-foreground">Ready to help — DE, EN, TR, UR, HI, PA, AR, KU, RU, UK, FA, PL</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              "What documents do I need for Kindergeld?",
              "Draft a letter to the Ausländerbehörde",
              "Find English-speaking Hausarzt in Berlin",
              "Explain Wohngeld eligibility in Urdu",
            ].map((q) => (
              <Link
                key={q}
                to="/app/assistant"
                className="block rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                › {q}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          icon={FileCheck2}
          title="Checklist — First 30 days"
          body="You're 3 of 9 done. Bank account and health insurance next."
          href="/app/checklists"
        />
        <Card
          icon={Clock}
          title="Upcoming — Residence permit renewal"
          body="Ausländerbehörde Berlin · 22 Nov · 09:30. Documents prepared."
          href="/app/documents"
        />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "accent" }) {
  return (
    <div className={`rounded-2xl border border-border/60 p-5 shadow-soft ${tone === "accent" ? "bg-gradient-warm text-accent-foreground" : "bg-card"}`}>
      <div className="text-xs uppercase tracking-widest opacity-80">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs opacity-80">{sub}</div>
    </div>
  );
}

function Card({ icon: Icon, title, body, href }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; href: string }) {
  return (
    <Link
      to={href}
      className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-display text-lg font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
