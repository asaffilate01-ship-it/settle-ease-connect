import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { listMyExpertQuotes } from "@/lib/expert-portal.functions";

export const Route = createFileRoute("/_authenticated/expert/quotes")({
  head: () => ({ meta: [{ title: "Expert — quotes" }] }),
  component: ExpertQuotes,
});

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-foreground",
  sent: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  declined: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  expired: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  superseded: "bg-muted text-muted-foreground",
};

function ExpertQuotes() {
  const { t } = useTranslation();
  const fn = useServerFn(listMyExpertQuotes);
  const q = useQuery({ queryKey: ["expert", "quotes"], queryFn: () => fn() });

  const rows = q.data ?? [];
  const totals = rows.reduce(
    (acc: any, r: any) => {
      const amt = Number(r.amount_eur ?? 0);
      acc.total += amt;
      if (r.status === "sent" || r.status === "draft") acc.open += amt;
      if (r.status === "accepted") acc.won += amt;
      return acc;
    },
    { total: 0, open: 0, won: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">
          {t("expert.quotes.title", { defaultValue: "Quotes" })}
        </h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={t("expert.quotes.kpi.total", { defaultValue: "All quotes" })} value={`€${totals.total.toFixed(0)}`} />
        <Kpi label={t("expert.quotes.kpi.open", { defaultValue: "Open value" })} value={`€${totals.open.toFixed(0)}`} tone="primary" />
        <Kpi label={t("expert.quotes.kpi.won", { defaultValue: "Accepted" })} value={`€${totals.won.toFixed(0)}`} tone="success" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">{t("expert.quotes.col.case", { defaultValue: "Case" })}</th>
              <th className="p-3">{t("expert.quotes.col.title", { defaultValue: "Quote" })}</th>
              <th className="p-3">{t("expert.quotes.col.amount", { defaultValue: "Amount" })}</th>
              <th className="p-3">{t("expert.quotes.col.model", { defaultValue: "Model" })}</th>
              <th className="p-3">{t("expert.quotes.col.status", { defaultValue: "Status" })}</th>
              <th className="p-3">{t("expert.quotes.col.sent", { defaultValue: "Sent" })}</th>
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
                <td className="p-3">{r.title || "—"}</td>
                <td className="p-3 font-medium">€{Number(r.amount_eur ?? 0).toFixed(2)}</td>
                <td className="p-3 text-muted-foreground capitalize">{String(r.compensation_model ?? "").replace(/_/g, " ")}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[r.status] ?? "bg-muted text-muted-foreground"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.sent_at ? new Date(r.sent_at).toLocaleDateString() : "—"}
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
                  {t("expert.quotes.empty", { defaultValue: "No quotes yet. Send one from a case to get started." })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" }) {
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
