import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { listMyExpertInvoices } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/invoices")({
  head: () => ({ meta: [{ title: "Expert — invoices" }] }),
  component: ExpertInvoices,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  held_escrow: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  released: "bg-emerald-600/20 text-emerald-800 dark:text-emerald-200",
  refunded: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
};

function ExpertInvoices() {
  const { t } = useTranslation();
  const fn = useServerFn(listMyExpertInvoices);
  const q = useQuery({ queryKey: ["expert", "invoices"], queryFn: () => fn() });

  const rows = q.data ?? [];
  const totals = rows.reduce(
    (acc: any, r: any) => {
      const payout = Number(r.payout_to_expert_eur ?? 0);
      acc.gross += Number(r.amount_eur ?? 0);
      acc.payout += payout;
      if (r.status === "paid" || r.status === "released") acc.paid += payout;
      if (r.status === "held_escrow" || r.status === "pending") acc.pending += payout;
      return acc;
    },
    { gross: 0, payout: 0, paid: 0, pending: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">
          {t("expert.invoices.title", { defaultValue: "Invoices" })}
        </h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi
          label={t("expert.invoices.kpi.gross", { defaultValue: "Billed gross" })}
          value={`€${totals.gross.toFixed(0)}`}
        />
        <Kpi
          label={t("expert.invoices.kpi.pending", { defaultValue: "Escrow / pending" })}
          value={`€${totals.pending.toFixed(0)}`}
          tone="primary"
        />
        <Kpi
          label={t("expert.invoices.kpi.paid", { defaultValue: "Paid out" })}
          value={`€${totals.paid.toFixed(0)}`}
          tone="success"
        />
        <Kpi
          label={t("expert.invoices.kpi.count", { defaultValue: "Invoices" })}
          value={String(rows.length)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">{t("expert.invoices.col.case", { defaultValue: "Case" })}</th>
              <th className="p-3">{t("expert.invoices.col.gross", { defaultValue: "Gross" })}</th>
              <th className="p-3">
                {t("expert.invoices.col.fee", { defaultValue: "Platform fee" })}
              </th>
              <th className="p-3">
                {t("expert.invoices.col.payout", { defaultValue: "Your payout" })}
              </th>
              <th className="p-3">{t("expert.invoices.col.status", { defaultValue: "Status" })}</th>
              <th className="p-3">{t("expert.invoices.col.paid", { defaultValue: "Paid" })}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="p-3">
                  <div className="font-mono text-xs text-muted-foreground">{r.case_reference}</div>
                  <div className="truncate max-w-[220px]">{r.case_title}</div>
                </td>
                <td className="p-3">€{Number(r.amount_eur ?? 0).toFixed(2)}</td>
                <td className="p-3 text-muted-foreground">
                  €{Number(r.platform_fee_eur ?? 0).toFixed(2)}
                </td>
                <td className="p-3 font-medium">
                  €{Number(r.payout_to_expert_eur ?? 0).toFixed(2)}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[r.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {String(r.status).replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.paid_at
                    ? new Date(r.paid_at).toLocaleDateString()
                    : r.released_at
                      ? new Date(r.released_at).toLocaleDateString()
                      : "—"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    to="/expert/cases/$caseId"
                    params={{ caseId: r.case_id }}
                    className="text-primary hover:underline"
                  >
                    {t("common.open", { defaultValue: "Open" })} →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !q.isLoading && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  {t("expert.invoices.empty", { defaultValue: "No invoices yet." })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary" | "success";
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-emerald-600 dark:text-emerald-300"
        : "";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
