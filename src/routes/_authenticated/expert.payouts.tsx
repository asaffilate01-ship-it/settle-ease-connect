import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyPayouts, getMyExpertKpis } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/payouts")({
  head: () => ({ meta: [{ title: "Expert — earnings" }] }),
  component: ExpertPayouts,
});

function ExpertPayouts() {
  const { t } = useTranslation();
  const listFn = useServerFn(listMyPayouts);
  const kpiFn = useServerFn(getMyExpertKpis);
  const list = useQuery({ queryKey: ["expert", "payouts"], queryFn: () => listFn() });
  const kpis = useQuery({ queryKey: ["expert", "kpis"], queryFn: () => kpiFn() });

  const rows = list.data ?? [];
  const k = kpis.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {t("expert.payouts.title", { defaultValue: "Earnings" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("expert.payouts.subtitle", {
            defaultValue: "All referral fees, wholesale markups, and hourly payouts owed to you.",
          })}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label={t("expert.kpi.pending", { defaultValue: "Pending" })}
          value={`€${(k?.pendingEur ?? 0).toFixed(2)}`}
        />
        <Kpi
          label={t("expert.kpi.paidYtd", { defaultValue: "Paid YTD" })}
          value={`€${(k?.paidYtdEur ?? 0).toFixed(2)}`}
        />
        <Kpi label={t("expert.kpi.entries", { defaultValue: "Entries" })} value={rows.length} />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">{t("expert.table.period", { defaultValue: "Period" })}</th>
              <th className="p-3">{t("expert.table.kind", { defaultValue: "Kind" })}</th>
              <th className="p-3">
                {t("expert.table.description", { defaultValue: "Description" })}
              </th>
              <th className="p-3">{t("expert.table.gross", { defaultValue: "Gross" })}</th>
              <th className="p-3">{t("expert.table.rate", { defaultValue: "Rate" })}</th>
              <th className="p-3">{t("expert.table.amount", { defaultValue: "Amount" })}</th>
              <th className="p-3">{t("expert.table.status", { defaultValue: "Status" })}</th>
              <th className="p-3">{t("expert.table.paidOn", { defaultValue: "Paid" })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id} className="border-t border-border/40">
                <td className="p-3 text-muted-foreground">
                  {p.period_month
                    ? new Date(p.period_month).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="p-3 capitalize">{String(p.kind).replace(/_/g, " ")}</td>
                <td className="p-3 text-muted-foreground">{p.description ?? "—"}</td>
                <td className="p-3">€{Number(p.gross_eur ?? 0).toFixed(2)}</td>
                <td className="p-3 text-muted-foreground">
                  {p.rate ? `${(Number(p.rate) * 100).toFixed(1)}%` : "—"}
                </td>
                <td className="p-3 font-medium">€{Number(p.amount_eur ?? 0).toFixed(2)}</td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3 text-muted-foreground">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground">
                  {t("expert.payouts.empty", { defaultValue: "No earnings recorded yet." })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
