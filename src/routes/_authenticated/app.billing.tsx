import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBillingOverview, getBillingHistory } from "@/lib/billing.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/app/billing")({
  head: () => ({ meta: [{ title: "Billing & payments — Beistand+" }] }),
  component: BillingPage,
});

function money(amount: number, currency = "eur", locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function BillingPage() {
  const { t, i18n } = useTranslation();
  const overviewFn = useServerFn(getBillingOverview);
  const historyFn = useServerFn(getBillingHistory);
  const portalFn = useServerFn(createPortalSession);

  const { data: overview, isLoading } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: () => overviewFn(),
  });
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["billing-history"],
    queryFn: () => historyFn({ data: { environment: getStripeEnvironment() } }),
  });

  const openPortal = useMutation({
    mutationFn: async () => {
      const res: any = await portalFn({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: typeof window !== "undefined" ? `${window.location.origin}/app/billing` : undefined,
        },
      });
      if (res && "error" in res) throw new Error(res.error);
      return res.url as string;
    },
    onSuccess: (url) => window.open(url, "_blank"),
    onError: (e: any) =>
      toast.error(e?.message ?? t("billing.portalFailed", "Could not open the billing portal")),
  });

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const historyError = history && "error" in history ? history.error : null;
  const invoices = history && !("error" in history) ? history.invoices : [];
  const totals =
    history && !("error" in history)
      ? history.totals
      : { paidToDate: 0, outstanding: 0, currency: "eur" };
  const upcoming = history && !("error" in history) ? history.upcoming : null;

  const sub = overview?.subscription ?? null;
  const policies = overview?.funeralPolicies ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display-lg font-semibold">
            {t("billing.title", "Billing & payments")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "billing.subtitle",
              "Your plan, funeral cover, payments made and anything due — all in one place.",
            )}
          </p>
        </div>
        <Button variant="outline" disabled={openPortal.isPending} onClick={() => openPortal.mutate()}>
          <CreditCard className="mr-2 h-4 w-4" />
          {t("billing.managePayment", "Manage payment method")}
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Tile
              icon={<ShieldCheck className="h-4 w-4" />}
              label={t("billing.plan", "Plan")}
              value={sub?.plan_name ?? sub?.plan_code ?? t("billing.noPlan", "No plan")}
              hint={sub?.status ?? undefined}
            />
            <Tile
              icon={<TrendingUp className="h-4 w-4" />}
              label={t("billing.monthlyCommitment", "Monthly total")}
              value={money(overview?.monthlyCommitmentEur ?? 0, "eur", i18n.language)}
              hint={t("billing.planPlusCover", "Plan + funeral cover")}
            />
            <Tile
              icon={<Receipt className="h-4 w-4" />}
              label={t("billing.paidToDate", "Paid to date")}
              value={money(totals.paidToDate, totals.currency, i18n.language)}
            />
            <Tile
              icon={<FileText className="h-4 w-4" />}
              label={t("billing.outstanding", "Outstanding")}
              value={money(totals.outstanding, totals.currency, i18n.language)}
              tone={totals.outstanding > 0 ? "warning" : "muted"}
            />
          </div>

          {sub ? (
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              <h2 className="font-display text-xl font-semibold">
                {t("billing.subscription", "Subscription")}
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Row label={t("billing.status", "Status")} value={sub.status} />
                <Row
                  label={t("billing.price", "Price")}
                  value={sub.monthly_price_eur != null ? `${money(sub.monthly_price_eur, "eur", i18n.language)}/mo` : "—"}
                />
                <Row
                  label={t("billing.currentPeriod", "Current period")}
                  value={
                    sub.current_period_start && sub.current_period_end
                      ? `${dateFmt.format(new Date(sub.current_period_start))} – ${dateFmt.format(new Date(sub.current_period_end))}`
                      : "—"
                  }
                />
                <Row
                  label={t("billing.renews", "Renews")}
                  value={
                    sub.cancel_at_period_end
                      ? t("billing.endsAtPeriodEnd", "Ends at period end")
                      : sub.current_period_end
                        ? dateFmt.format(new Date(sub.current_period_end))
                        : "—"
                  }
                />
              </dl>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-border/60 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("billing.noPlanBody", "You don't have an active plan yet.")}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/app/upgrade">{t("billing.choosePlan", "Choose a plan")}</Link>
              </Button>
            </section>
          )}

          {policies.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold">
                {t("billing.funeralCover", "Funeral cover")}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {policies.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{p.insurer_name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {p.status}
                      </Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <Row
                        label={t("billing.premium", "Premium")}
                        value={`${money(p.premium_eur, "eur", i18n.language)} / ${p.premium_cadence}`}
                      />
                      <Row
                        label={t("billing.benefit", "Cover amount")}
                        value={money(Number(p.benefit_eur), "eur", i18n.language)}
                      />
                      <Row
                        label={t("billing.household", "Household")}
                        value={`${p.household_kind} · ${p.adults_covered} + ${p.children_covered}`}
                      />
                      <Row
                        label={t("billing.renewal", "Renewal")}
                        value={p.renewal_date ? dateFmt.format(new Date(p.renewal_date)) : "—"}
                      />
                    </dl>
                    {p.policy_number && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t("billing.policyNumber", "Policy")} {p.policy_number}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="font-medium">{t("billing.due", "Payment due")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {money(upcoming.amount_due, upcoming.currency, i18n.language)}
                {upcoming.next_payment_attempt
                  ? ` · ${dateFmt.format(new Date(upcoming.next_payment_attempt))}`
                  : ""}
              </p>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">
              {t("billing.history", "Payment history")}
            </h2>
            {historyError ? (
              <p className="text-sm text-destructive">{historyError}</p>
            ) : historyLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading", "Loading…")}</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("billing.noInvoices", "No payments recorded yet.")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">{t("billing.date", "Date")}</th>
                      <th className="px-4 py-2.5">{t("billing.description", "Description")}</th>
                      <th className="px-4 py-2.5">{t("billing.status", "Status")}</th>
                      <th className="px-4 py-2.5 text-right">{t("billing.amount", "Amount")}</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {inv.created ? dateFmt.format(new Date(inv.created)) : "—"}
                        </td>
                        <td className="px-4 py-2.5">{inv.description ?? inv.number ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {inv.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {money(inv.amount_paid || inv.amount_due, inv.currency, i18n.language)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {inv.pdf_url && (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t("billing.pdf", "PDF")}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  hint,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "muted" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-border/60 bg-card";
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${cls}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
