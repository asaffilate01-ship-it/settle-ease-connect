import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, FileCheck2, HeartHandshake, Lock, MessageSquare, Shield, Receipt, Briefcase, AlertTriangle, CalendarClock, FileWarning, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PlanChip } from "@/components/paywall";
import { tierMeets, useSubscription, type PlanGroup } from "@/lib/subscription";
import { ClayIcon } from "@/components/clay-icon";
import { PolishedCard } from "@/components/polished-card";
import { getCustomerOverview } from "@/lib/customer-overview.functions";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Overview,
});

function Overview() {
  const [firstName, setFirstName] = useState<string>("");
  const sub = useSubscription();
  const loadOverview = useServerFn(getCustomerOverview);
  const overview = useQuery({
    queryKey: ["customer-overview"],
    queryFn: () => loadOverview({}),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const meta = (u.user_metadata ?? {}) as Record<string, string>;
      const full = meta.full_name || meta.name || u.email?.split("@")[0] || "";
      setFirstName(full.split(" ")[0] ?? "");
    })();
  }, []);

  if (sub.loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const noPlan = sub.planGroup === "none";
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Guten Abend" : hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-soft sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{today}</span>
              <PlanChip />
            </div>
            <h1 className="display-lg mt-2 font-semibold">
              {greeting}{firstName ? `, ${firstName}` : ""} — <span className="text-muted-foreground">here's your day.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Your household hub for settlement in Germany — checklists, benefits, insurance, cases and support in 12 languages.
            </p>
          </div>
        </div>
      </div>

      {noPlan && (
        <NoPlanBanner />
      )}

      {!noPlan && (
        <div className="grid gap-4 md:grid-cols-3">
          <QuickStat
            label="Your plan"
            value={sub.planName ?? "—"}
            sub={sub.monthlyPrice ? `€${sub.monthlyPrice}/mo · ${sub.status}` : sub.status ?? ""}
          />
          <QuickStat
            label="Open cases"
            value={overview.data ? String(overview.data.openCasesCount) : "—"}
            sub={
              overview.data
                ? overview.data.breachedCount > 0
                  ? `${overview.data.breachedCount} SLA breached`
                  : overview.data.atRiskCount > 0
                    ? `${overview.data.atRiskCount} at risk`
                    : "All on track"
                : ""
            }
          />
          <QuickStat
            label="Documents in vault"
            value={overview.data ? String(overview.data.vaultCount) : "—"}
            sub={
              overview.data && overview.data.missingDocsCases.length > 0
                ? `${overview.data.missingDocsCases.length} case${overview.data.missingDocsCases.length === 1 ? "" : "s"} need docs`
                : "All cases have documents"
            }
            tone="accent"
          />
        </div>
      )}

      {!noPlan && overview.data && (
        <UrgentActions data={overview.data} />
      )}


      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">What you can do today</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureTile
            title="Ask BeistandPlus AI"
            body="Chat in 11 languages — forms, benefits, appointments."
            icon={Sparkles}
            tone="aurora"
            href="/app/assistant"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Checklists"
            body="First 30 days, Anmeldung, tax number, GP registration."
            icon={FileCheck2}
            tone="teal"
            href="/app/checklists"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Benefits finder"
            body="Kindergeld, Wohngeld, Bürgergeld, disability & care."
            icon={HeartHandshake}
            tone="sun"
            href="/app/benefits"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Insurance & claims"
            body="Register with insurers, file claims, track payouts."
            icon={Shield}
            tone="ocean"
            href="/app/insurance"
            requires="plus"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Tax & Steuererklärung"
            body="Prepare and file with revenue authority (ELSTER)."
            icon={Receipt}
            tone="mint"
            href="/app/checklists"
            requires="plus"
            current={sub.planGroup}
          />
          <FeatureTile
            title="My case"
            body="Track progress, chat with your case manager, upload documents."
            icon={Briefcase}
            tone="coral"
            href="/app/cases"
            requires="complete"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Household vault"
            body="Store IDs, contracts, medical & insurance papers securely."
            icon={FileCheck2}
            tone="teal"
            href="/app/documents"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Community"
            body="Mosques, churches, temples, halal food & women's groups near you."
            icon={HeartHandshake}
            tone="sun"
            href="/app/community"
            requires="none"
            current={sub.planGroup}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <PolishedCard glow className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <ClayIcon icon={MessageSquare} tone="aurora" size="md" />
            <div>
              <div className="font-display text-lg font-semibold">BeistandPlus AI</div>
              <div className="text-xs text-muted-foreground">DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · PS</div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "What documents do I need for Kindergeld?",
              "Draft a letter to the Ausländerbehörde",
              "Find English-speaking Hausarzt near me",
              "Explain Wohngeld eligibility in Urdu",
            ].map((q) => (
              <Link
                key={q}
                to="/app/assistant"
                className="rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                › {q}
              </Link>
            ))}
          </div>
        </PolishedCard>

        <PolishedCard className="p-6">
          <div className="font-display text-lg font-semibold">Your account</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Plan">{sub.planName ?? "No plan"}</Row>
            <Row label="Status">{sub.status ?? "—"}</Row>
            <Row label="Monthly">{sub.monthlyPrice ? `€${sub.monthlyPrice}` : "—"}</Row>
            {sub.currentPeriodEnd && (
              <Row label="Renews">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</Row>
            )}
          </dl>
          <Link
            to="/app/upgrade"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {noPlan ? "Choose a plan" : "Change plan"}
          </Link>
        </PolishedCard>
      </div>
    </div>
  );
}

function NoPlanBanner() {
  return (
    <PolishedCard glow className="border-primary/40 p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <ClayIcon icon={Sparkles} tone="aurora" size="md" />
        <div className="flex-1">
          <div className="font-display text-lg font-semibold">Activate your plan to unlock the dashboard</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Basic €5/mo · Plus €10/mo · Complete €25/mo. Third-party costs always separate — nothing hidden.
          </p>
        </div>
        <Link to="/app/upgrade" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          View plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PolishedCard>
  );
}

function FeatureTile({
  title, body, icon: Icon, tone, href, requires, current,
}: {
  title: string; body: string; icon: LucideIcon;
  tone: "ocean" | "teal" | "aurora" | "coral" | "sun" | "mint" | "ink";
  href: string; requires: PlanGroup; current: PlanGroup;
}) {
  const unlocked = tierMeets(current, requires);
  const TIER_LABEL: Record<PlanGroup, string> = { none: "No plan", basic: "Basic", plus: "Plus", complete: "Complete" };
  const TIER_TONE: Record<PlanGroup, string> = {
    none: "bg-muted text-muted-foreground",
    basic: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    plus: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    complete: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  const target = unlocked ? href : "/app/upgrade";
  return (
    <Link to={target} className="group block">
      <PolishedCard glow={unlocked} className={`h-full p-5 ${unlocked ? "" : "opacity-90"}`}>
        <div className="flex items-start justify-between gap-2">
          <ClayIcon icon={unlocked ? Icon : Lock} tone={unlocked ? tone : "ink"} size="md" />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_TONE[requires]}`}>
            {TIER_LABEL[requires]}
          </span>
        </div>
        <div className="mt-3 font-display text-base font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <div className="mt-3 text-xs font-medium text-primary">
          {unlocked ? "Open" : "Upgrade to unlock"} <ArrowRight className="inline h-3 w-3" />
        </div>
      </PolishedCard>
    </Link>
  );
}

function QuickStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "accent" }) {
  return (
    <div className={`rounded-2xl border border-border/60 p-5 shadow-soft ${tone === "accent" ? "bg-gradient-warm text-accent-foreground" : "bg-card"}`}>
      <div className="text-xs uppercase tracking-widest opacity-80">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs opacity-80">{sub}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

type OverviewData = {
  openCases: Array<{ case_id: string; title: string; sla_state: string; sla_due_at: string | null; current_stage: string | null; status: string }>;
  upcomingAppointments: Array<{ id: string; case_id: string; title: string; starts_at: string; location: string | null; meeting_url: string | null }>;
  missingDocsCases: Array<{ case_id: string; title: string }>;
  nextAppointment: { id: string; case_id: string; title: string; starts_at: string; location: string | null; meeting_url: string | null } | null;
  breachedCount: number;
  atRiskCount: number;
};

function UrgentActions({ data }: { data: OverviewData }) {
  const breached = data.openCases.filter((c) => c.sla_state === "breached").slice(0, 3);
  const atRisk = data.openCases.filter((c) => c.sla_state === "at_risk").slice(0, 3);
  const nextAppts = data.upcomingAppointments.slice(0, 3);
  const missingDocs = data.missingDocsCases.slice(0, 3);

  const nothing =
    breached.length === 0 && atRisk.length === 0 && nextAppts.length === 0 && missingDocs.length === 0;
  if (nothing) return null;

  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Needs your attention</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <PolishedCard className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" /> SLA alerts
          </div>
          {breached.length === 0 && atRisk.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">All your cases are on track.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...breached, ...atRisk].map((c) => (
                <li key={c.case_id}>
                  <Link
                    to="/app/cases/$caseId"
                    params={{ caseId: c.case_id }}
                    className="flex items-center justify-between gap-2 hover:underline"
                  >
                    <span className="truncate">{c.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        c.sla_state === "breached"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {c.sla_state}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PolishedCard>

        <PolishedCard className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" /> Next appointments
          </div>
          {nextAppts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No appointments in the next 30 days.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {nextAppts.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/app/cases/$caseId"
                    params={{ caseId: a.case_id }}
                    className="block hover:underline"
                  >
                    <div className="truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{fmt(a.starts_at)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PolishedCard>

        <PolishedCard className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileWarning className="h-4 w-4 text-amber-600" /> Missing documents
          </div>
          {missingDocs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">All your cases have documents uploaded.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {missingDocs.map((c) => (
                <li key={c.case_id}>
                  <Link
                    to="/app/cases/$caseId"
                    params={{ caseId: c.case_id }}
                    className="flex items-center justify-between gap-2 hover:underline"
                  >
                    <span className="truncate">{c.title}</span>
                    <span className="shrink-0 text-xs text-primary">Upload →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PolishedCard>
      </div>
    </section>
  );
}
