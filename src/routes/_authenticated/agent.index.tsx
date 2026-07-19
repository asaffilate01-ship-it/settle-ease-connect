import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowUpRight, Link2, TrendingUp, Users } from "lucide-react";
import {
  getMyAgentKpis,
  getMyAgentProfile,
  listMyReferrals,
  listMyCommissions,
  getMyAgentFunnel,
} from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/agent/")({
  head: () => ({ meta: [{ title: "Agent — overview" }] }),
  component: AgentHome,
});

const PRODUCT_LABEL: Record<string, string> = {
  subscription_basic: "Basic",
  subscription_plus: "Plus",
  subscription_complete: "Complete",
  funeral_cover: "Funeral",
  group_cover: "Group",
};

function AgentHome() {
  const { t } = useTranslation();
  const kpiFn = useServerFn(getMyAgentKpis);
  const profileFn = useServerFn(getMyAgentProfile);
  const refsFn = useServerFn(listMyReferrals);
  const commsFn = useServerFn(listMyCommissions);
  const funnelFn = useServerFn(getMyAgentFunnel);

  const kpis = useQuery({ queryKey: ["agent", "kpis"], queryFn: () => kpiFn() });
  const profile = useQuery({ queryKey: ["agent", "profile"], queryFn: () => profileFn() });
  const referrals = useQuery({ queryKey: ["agent", "referrals"], queryFn: () => refsFn() });
  const commissions = useQuery({ queryKey: ["agent", "commissions"], queryFn: () => commsFn() });
  const funnel = useQuery({ queryKey: ["agent", "funnel"], queryFn: () => funnelFn() });

  const rate = Number(profile.data?.commission_rate ?? 5);

  // Build 30-day earnings sparkline from commissions (daily = paid_at bucket, fallback period_month)
  const spark = useMemo(() => {
    const days = 30;
    const buckets = new Array<number>(days).fill(0);
    const now = new Date();
    (commissions.data ?? []).forEach((c: any) => {
      const when = c.paid_at ? new Date(c.paid_at) : c.period_month ? new Date(c.period_month) : null;
      if (!when) return;
      const diff = Math.floor((now.getTime() - when.getTime()) / 86_400_000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += Number(c.commission_eur ?? 0);
    });
    const max = Math.max(1, ...buckets);
    return { buckets, max, total: buckets.reduce((s, v) => s + v, 0) };
  }, [commissions.data]);

  const refs = referrals.data ?? [];
  const linkStats = useMemo(() => {
    const total = refs.length;
    const signedUp = refs.filter((r: any) => r.referred_user_id).length;
    const linkSourced = refs.filter((r: any) => r.source === "link").length;
    const bySource: Record<string, number> = {};
    refs.forEach((r: any) => {
      const s = r.source ?? "other";
      bySource[s] = (bySource[s] ?? 0) + 1;
    });
    const topSource =
      Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return {
      total,
      signedUp,
      linkSourced,
      convPct: total ? Math.round((signedUp / total) * 100) : 0,
      topSource,
    };
  }, [refs]);

  const productMix = useMemo(() => {
    const mix: Record<string, number> = {};
    refs.forEach((r: any) => {
      const k = r.product ?? "other";
      mix[k] = (mix[k] ?? 0) + 1;
    });
    return Object.entries(mix).sort((a, b) => b[1] - a[1]);
  }, [refs]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> {rate}% recurring
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold">
            {profile.data?.display_name
              ? t("agent.home.welcomeNamed", { defaultValue: "Welcome, {{name}}", name: profile.data.display_name })
              : t("agent.home.welcome", { defaultValue: "Welcome" })}
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            {t("agent.home.tagline", {
              defaultValue: "Sell subscriptions and funeral cover. Earn {{rate}}% recurring on every referred client.",
              rate,
            })}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label={t("agent.kpi.clients", { defaultValue: "Clients" })} value={kpis.data?.totalClients ?? 0} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("agent.kpi.thisMonth", { defaultValue: "This month" })} value={`€${(kpis.data?.mtdEur ?? 0).toFixed(2)}`} tone="primary" />
        <Kpi icon={<ArrowUpRight className="h-4 w-4" />} label={t("agent.kpi.pending", { defaultValue: "Pending" })} value={`€${(kpis.data?.pendingEur ?? 0).toFixed(2)}`} />
        <Kpi icon={<Link2 className="h-4 w-4" />} label={t("agent.kpi.paid", { defaultValue: "Paid to date" })} value={`€${(kpis.data?.totalEarnedEur ?? 0).toFixed(2)}`} tone="success" />
      </section>

      {/* Sparkline + Share-link performance */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("agent.spark.title", { defaultValue: "Last 30 days" })}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="font-display text-2xl font-semibold">€{spark.total.toFixed(0)}</div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>
          <Sparkline data={spark.buckets} max={spark.max} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">
              {t("agent.link.title", { defaultValue: "Share-link performance" })}
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MiniStat label={t("agent.link.clicks", { defaultValue: "Referrals" })} value={linkStats.total} />
            <MiniStat label={t("agent.link.signups", { defaultValue: "Signed up" })} value={linkStats.signedUp} />
            <MiniStat label={t("agent.link.conv", { defaultValue: "Conversion" })} value={`${linkStats.convPct}%`} tone="primary" />
            <MiniStat label={t("agent.link.source", { defaultValue: "Top source" })} value={linkStats.topSource} />
          </div>
          <Link
            to="/agent/link"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("agent.link.copy", { defaultValue: "Copy your referral link" })} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Pipeline funnel */}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">
            {t("agent.funnel.title", { defaultValue: "Pipeline by stage" })}
          </h3>
        </div>
        <div className="mt-4 space-y-3">
          {(funnel.data?.stages ?? []).map((s: any, i: number) => {
            const max = Math.max(1, ...(funnel.data?.stages ?? []).map((x: any) => x.count));
            const pct = Math.round((s.count / max) * 100);
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
                    style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }}
                  />
                </div>
              </div>
            );
          })}
          {!funnel.data && (
            <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Loading…" })}</p>
          )}
        </div>
        {productMix.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {productMix.map(([k, n]) => (
              <span key={k} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                <span className="text-muted-foreground">{PRODUCT_LABEL[k] ?? k}:</span>{" "}
                <span className="font-medium">{n}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Recent referrals */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">
          {t("agent.home.recent", { defaultValue: "Recent referrals" })}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">{t("agent.table.when", { defaultValue: "When" })}</th>
                <th className="p-3">{t("agent.table.email", { defaultValue: "Email" })}</th>
                <th className="p-3">{t("agent.table.product", { defaultValue: "Product" })}</th>
                <th className="p-3">{t("agent.table.source", { defaultValue: "Source" })}</th>
                <th className="p-3">{t("agent.table.status", { defaultValue: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {refs.slice(0, 10).map((r: any) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{r.referred_email ?? "—"}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {PRODUCT_LABEL[r.product] ?? r.product ?? "—"}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">{r.source ?? "—"}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
              {refs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    {t("agent.home.emptyReferrals", { defaultValue: "No referrals yet. Share your link from the “Referral link” tab." })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone, icon }: { label: string; value: string | number; tone?: "primary" | "success"; icon?: React.ReactNode }) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-emerald-600 dark:text-emerald-300"
        : "";
  const badgeCls =
    tone === "primary"
      ? "bg-primary/10 text-primary ring-primary/20"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300"
        : "bg-muted text-muted-foreground ring-border/60";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all hover:shadow-elevated">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`mt-1 font-display text-2xl font-semibold ${toneCls}`}>{value}</div>
        </div>
        {icon && (
          <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${badgeCls}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone?: "primary" }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-semibold ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const w = 320;
  const h = 60;
  const step = w / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#spark-fill)"
        className="text-primary"
      />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
    </svg>
  );
}
