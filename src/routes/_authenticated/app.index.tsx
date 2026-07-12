import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, FileCheck2, HeartHandshake, Lock, MessageSquare, Shield, Receipt, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanChip } from "@/components/paywall";
import { tierMeets, useSubscription, type PlanGroup } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Overview,
});

function Overview() {
  const [firstName, setFirstName] = useState<string>("");
  const sub = useSubscription();

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Willkommen zurück</span>
            <PlanChip />
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            {firstName ? `${firstName}, ` : ""}here's your day.
          </h1>
        </div>
      </div>

      {noPlan && (
        <NoPlanBanner />
      )}

      {!noPlan && (
        <div className="grid gap-4 md:grid-cols-3">
          <QuickStat label="Your plan" value={sub.planName ?? "—"} sub={sub.monthlyPrice ? `€${sub.monthlyPrice}/mo · ${sub.status}` : sub.status ?? ""} />
          <QuickStat label="Tasks due this week" value="4" sub="1 needs signature" />
          <QuickStat label="Documents in vault" value="6" sub="2 expire this year" tone="accent" />
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">What you can do today</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureTile
            title="Ask Beistand AI"
            body="Chat in 11 languages — forms, benefits, appointments."
            icon={Sparkles}
            href="/app/assistant"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Checklists"
            body="First 30 days, Anmeldung, tax number, GP registration."
            icon={FileCheck2}
            href="/app/checklists"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Benefits finder"
            body="Kindergeld, Wohngeld, Bürgergeld, disability & care."
            icon={HeartHandshake}
            href="/app/benefits"
            requires="basic"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Insurance & claims"
            body="Register with insurers, file claims, track payouts."
            icon={Shield}
            href="/app/insurance"
            requires="plus"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Tax & Steuererklärung"
            body="Prepare and file with revenue authority (ELSTER)."
            icon={Receipt}
            href="/app/checklists"
            requires="plus"
            current={sub.planGroup}
          />
          <FeatureTile
            title="Case management"
            body="Dedicated manager for bereavement, visa, benefits."
            icon={Briefcase}
            href="/app/cases"
            requires="complete"
            current={sub.planGroup}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">Beistand AI</div>
              <div className="text-xs text-muted-foreground">DE · EN · TR · UR · HI · PA · AR · KU · RU · UK · FA · PL · ZH</div>
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
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
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
        </div>
      </div>
    </div>
  );
}

function NoPlanBanner() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
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
    </div>
  );
}

function FeatureTile({
  title, body, icon: Icon, href, requires, current,
}: {
  title: string; body: string; icon: React.ComponentType<{ className?: string }>;
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
    <Link
      to={target}
      className={`group relative flex flex-col rounded-2xl border p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated ${
        unlocked ? "bg-card" : "bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_TONE[requires]}`}>
          {TIER_LABEL[requires]}
        </span>
      </div>
      <div className="mt-3 font-display text-base font-semibold">{title}</div>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{body}</p>
      <div className="mt-3 text-xs font-medium text-primary">
        {unlocked ? "Open" : "Upgrade to unlock"} <ArrowRight className="inline h-3 w-3" />
      </div>
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
