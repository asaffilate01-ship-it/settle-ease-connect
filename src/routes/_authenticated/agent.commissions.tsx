import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyAgentProfile, listMyCommissions } from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/agent/commissions")({
  head: () => ({ meta: [{ title: "Agent — commissions" }] }),
  component: AgentCommissions,
});

function AgentCommissions() {
  const { t } = useTranslation();
  const listFn = useServerFn(listMyCommissions);
  const profileFn = useServerFn(getMyAgentProfile);
  const { data = [] } = useQuery({ queryKey: ["agent", "commissions"], queryFn: () => listFn() });
  const { data: profile } = useQuery({
    queryKey: ["agent", "profile"],
    queryFn: () => profileFn(),
  });
  const rate = Number(profile?.commission_rate ?? 5);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {t("agent.commissions.title", { defaultValue: "Commissions" })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("agent.commissions.subtitle", {
            defaultValue:
              "Paid monthly, calculated as {{rate}}% of the monthly subscription fee for each client you referred. Third-party costs (insurance, funeral cover) are excluded from the commission base.",
            rate,
          })}
        </p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">{t("agent.commissions.period", { defaultValue: "Period" })}</th>
              <th className="p-3">{t("agent.table.product", { defaultValue: "Product" })}</th>
              <th className="p-3 text-right">
                {t("agent.commissions.gross", { defaultValue: "Gross" })}
              </th>
              <th className="p-3 text-right">
                {t("agent.commissions.rate", { defaultValue: "Rate" })}
              </th>
              <th className="p-3 text-right">
                {t("agent.commissions.commission", { defaultValue: "Commission" })}
              </th>
              <th className="p-3">{t("agent.table.status", { defaultValue: "Status" })}</th>
              <th className="p-3">{t("agent.commissions.paidAt", { defaultValue: "Paid at" })}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="p-3">{r.period_month}</td>
                <td className="p-3">{r.product}</td>
                <td className="p-3 text-right tabular-nums">€{Number(r.gross_eur).toFixed(2)}</td>
                <td className="p-3 text-right tabular-nums">
                  {Number(r.commission_rate).toFixed(2)}%
                </td>
                <td className="p-3 text-right font-medium tabular-nums">
                  €{Number(r.commission_eur).toFixed(2)}
                </td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3 text-muted-foreground">
                  {r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {t("agent.commissions.empty", {
                    defaultValue:
                      "No commissions yet — they appear after your first referred client’s subscription is billed.",
                  })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
