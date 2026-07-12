import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { FuneralCase } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Paperclip, Phone, Sparkles, MapPin, User } from "lucide-react";
import { caseTasksByStage, mockCases, stageLabels, stageOrder } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/app/cases/$caseId")({
  loader: ({ params }) => {
    const caseRecord = mockCases.find((c) => c.id === params.caseId);
    if (!caseRecord) throw notFound();
    return { caseRecord };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <div className="font-display text-2xl">Case not found</div>
      <Link to="/app/cases" className="mt-4 inline-block text-primary">Back to cases</Link>
    </div>
  ),
  component: CaseDetail,
});

function CaseDetail() {
  const data = Route.useLoaderData() as { caseRecord: FuneralCase };
  const c = data.caseRecord;
  const tasks = caseTasksByStage[c.id] ?? [];
  const currentIdx = stageOrder.indexOf(c.stage);

  return (
    <div className="space-y-8">
      <Link to="/app/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold">{c.deceasedName}</h1>
            <Badge variant="secondary">{stageLabels[c.stage]}</Badge>
            {c.urgent && (
              <Badge className="bg-warning/20 text-warning-foreground border border-warning/40">Urgent</Badge>
            )}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {c.id} · Age {c.age} · {c.location === "home" ? "Died at home" : "Died in hospital"} · {c.city}, Germany
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Phone className="mr-1 h-4 w-4" /> Call family</Button>
          <Button className="bg-gradient-primary"><MessageSquare className="mr-1 h-4 w-4" /> Message</Button>
        </div>
      </div>

      {/* Stage tracker */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workflow</div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stageOrder.map((s, i) => {
            const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
            return (
              <li
                key={s}
                className={`rounded-lg border p-3 ${
                  state === "done"
                    ? "border-success/40 bg-success/10"
                    : state === "active"
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-parchment/40"
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-widest ${
                  state === "done" ? "text-success" : state === "active" ? "text-primary" : "text-muted-foreground"
                }`}>
                  Stage {i + 1}
                </div>
                <div className="mt-1 font-medium">{stageLabels[s]}</div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Tasks</h2>
            <span className="text-xs text-muted-foreground">{tasks.filter(t => t.done).length}/{tasks.length} complete</span>
          </div>
          {tasks.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">No tasks yet — case is in initial intake.</div>
          ) : (
            <div className="mt-4 space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      t.done ? "border-success bg-success text-success-foreground" : "border-border"
                    }`}
                  >
                    {t.done && <span className="text-[10px]">✓</span>}
                  </span>
                  <div className="flex-1">
                    <div className={`text-sm ${t.done ? "text-muted-foreground line-through" : "font-medium"}`}>{t.title}</div>
                    <div className="text-xs text-muted-foreground">Owner: {t.owner}{t.due ? ` · Due ${t.due}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI recommendations */}
          <div className="mt-6 rounded-xl border border-border/60 bg-parchment/50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Beistand AI · suggestion</div>
                <p className="mt-1 text-muted-foreground">
                  Based on repatriation to Pakistan, Qatar Airways cargo has the earliest slot (Thu 22:15 BER→DOH→LHE). Zinc coffin required — Furkan Bestattungen has one in stock. I can pre-fill the consulate NOC form now.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">Book cargo</Button>
                  <Button size="sm" variant="outline">Draft NOC</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stakeholders */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Stakeholders</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Stake role="Family contact" name={c.familyContact} extra={c.phone} icon={User} />
              <Stake role="Case manager" name={c.caseManager} extra="Beistand · Berlin" icon={User} />
              <Stake role="Funeral director" name="Furkan Bestattungen" extra="Berlin · verified" icon={MapPin} />
              <Stake role="Mosque" name="Şehitlik-Moschee" extra="Neukölln" icon={MapPin} />
              <Stake role="Consulate" name="Pakistan Consulate" extra="Frankfurt" icon={MapPin} />
              <Stake role="Airline" name="Qatar Airways Cargo" extra="BER → LHE" icon={MapPin} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Documents</h2>
            <div className="mt-3 space-y-2 text-sm">
              {["Todesbescheinigung.pdf", "GDPR consent.pdf", "Reisepass.pdf", "Insurance card.pdf"].map((d) => (
                <div key={d} className="flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stake({ role, name, extra, icon: Icon }: { role: string; name: string; extra: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{role}</div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{extra}</div>
      </div>
    </div>
  );
}
