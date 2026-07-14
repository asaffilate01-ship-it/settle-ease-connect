import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, AlertCircle, Briefcase, Wallet, Clock, Scale, Package, HeartHandshake } from "lucide-react";
import {
  getMyExpertProfile,
  getMyExpertKpis,
  listMyExpertCases,
  listMyPayouts,
  getMyProfessionActivity,
} from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/")({
  head: () => ({ meta: [{ title: "Expert — overview" }] }),
  component: ExpertHome,
});

function ExpertHome() {
  const { t } = useTranslation();
  const profileFn = useServerFn(getMyExpertProfile);
  const kpiFn = useServerFn(getMyExpertKpis);
  const casesFn = useServerFn(listMyExpertCases);
  const payoutsFn = useServerFn(listMyPayouts);

  const profile = useQuery({ queryKey: ["expert", "profile"], queryFn: () => profileFn() });
  const kpis = useQuery({ queryKey: ["expert", "kpis"], queryFn: () => kpiFn() });
  const cases = useQuery({ queryKey: ["expert", "cases"], queryFn: () => casesFn() });
  const payouts = useQuery({ queryKey: ["expert", "payouts"], queryFn: () => payoutsFn() });

  const p = profile.data;
  const k = kpis.data;

  if (!profile.isLoading && !p) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
          <h2 className="font-display text-lg font-semibold">
            {t("expert.setup.title", { defaultValue: "Expert profile not set up yet" })}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("expert.setup.body", {
              defaultValue:
                "You have an expert role but no expert profile record. Please contact your case manager or accept a pending invitation.",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {p?.full_name
            ? t("expert.home.welcomeNamed", { defaultValue: "Welcome, {{name}}", name: p.full_name })
            : t("expert.home.welcome", { defaultValue: "Welcome" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {p?.profession
            ? t("expert.home.tagline", {
                defaultValue: "Your {{profession}} workspace — cases, earnings, and profile.",
                profession: p.profession,
              })
            : t("expert.home.taglineGeneric", { defaultValue: "Your workspace." })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {k?.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" /> {t("expert.badge.verified", { defaultValue: "Verified" })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5" /> {t("expert.badge.pending", { defaultValue: "Verification pending" })}
            </span>
          )}
          {k?.compensation && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {k.compensation === "referral_fee"
                ? t("expert.comp.referral", { defaultValue: "Referral fee" })
                : k.compensation === "wholesale"
                  ? t("expert.comp.wholesale", { defaultValue: "Wholesale" })
                  : t("expert.comp.direct", { defaultValue: "Direct bill" })}
            </span>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Briefcase className="h-4 w-4" />}
          label={t("expert.kpi.activeCases", { defaultValue: "Active cases" })}
          value={k?.activeCases ?? 0}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label={t("expert.kpi.openAssignments", { defaultValue: "Open assignments" })}
          value={k?.openAssignments ?? 0}
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          label={t("expert.kpi.pending", { defaultValue: "Pending earnings" })}
          value={`€${(k?.pendingEur ?? 0).toFixed(2)}`}
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          label={t("expert.kpi.paidYtd", { defaultValue: "Paid YTD" })}
          value={`€${(k?.paidYtdEur ?? 0).toFixed(2)}`}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {t("expert.home.cases", { defaultValue: "My cases" })}
          </h2>
          <Link to="/expert/cases" className="text-sm text-primary hover:underline">
            {t("common.viewAll", { defaultValue: "View all" })} →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">{t("expert.table.reference", { defaultValue: "Ref" })}</th>
                <th className="p-3">{t("expert.table.title", { defaultValue: "Case" })}</th>
                <th className="p-3">{t("expert.table.role", { defaultValue: "Role" })}</th>
                <th className="p-3">{t("expert.table.status", { defaultValue: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {(cases.data ?? []).slice(0, 8).map((c: any) => (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="p-3 font-mono text-xs">{c.reference}</td>
                  <td className="p-3">{c.title}</td>
                  <td className="p-3 text-muted-foreground capitalize">{String(c.assignment_role).replace(/_/g, " ")}</td>
                  <td className="p-3 capitalize">{c.status}</td>
                </tr>
              ))}
              {(cases.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("expert.home.emptyCases", { defaultValue: "No cases assigned yet." })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {t("expert.home.recentPayouts", { defaultValue: "Recent earnings" })}
          </h2>
          <Link to="/expert/payouts" className="text-sm text-primary hover:underline">
            {t("common.viewAll", { defaultValue: "View all" })} →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">{t("expert.table.period", { defaultValue: "Period" })}</th>
                <th className="p-3">{t("expert.table.kind", { defaultValue: "Kind" })}</th>
                <th className="p-3">{t("expert.table.amount", { defaultValue: "Amount" })}</th>
                <th className="p-3">{t("expert.table.status", { defaultValue: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {(payouts.data ?? []).slice(0, 8).map((p: any) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="p-3 text-muted-foreground">{p.period_month ? new Date(p.period_month).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}</td>
                  <td className="p-3 capitalize">{String(p.kind).replace(/_/g, " ")}</td>
                  <td className="p-3 font-medium">€{Number(p.amount_eur ?? 0).toFixed(2)}</td>
                  <td className="p-3 capitalize">{p.status}</td>
                </tr>
              ))}
              {(payouts.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("expert.home.emptyPayouts", { defaultValue: "No earnings recorded yet." })}
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

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
