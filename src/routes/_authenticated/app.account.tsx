import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccountSummary, getMyAuditTrail } from "@/lib/account.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { evaluateBenefits } from "@/lib/benefits-eligibility";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  ShieldCheck,
  FileText,
  Users,
  Activity,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/app/account")({
  head: () => ({
    meta: [
      { title: "My account — BeistandPlus" },
      {
        name: "description",
        content:
          "Your membership, billing, benefits, vault deputies, and activity log in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function fmtDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtEur(n?: number | null) {
  if (n == null) return "—";
  return `€${Number(n).toLocaleString("de-DE")}`;
}

function AccountPage() {
  const fetchSummary = useServerFn(getMyAccountSummary);
  const fetchAudit = useServerFn(getMyAuditTrail);
  const portalFn = useServerFn(createPortalSession);
  const navigate = useNavigate();

  const summaryQ = useQuery({
    queryKey: ["account-summary"],
    queryFn: () => fetchSummary({}),
  });
  const auditQ = useQuery({
    queryKey: ["my-audit"],
    queryFn: () => fetchAudit({ data: { limit: 100 } }),
  });

  const openPortal = useMutation({
    mutationFn: async () => {
      const env = isPaymentsConfigured() ? getStripeEnvironment() : "sandbox";
      const result = await portalFn({
        data: {
          environment: env,
          returnUrl: `${window.location.origin}/app/account`,
        },
      });
      if ("error" in result) throw new Error(result.error);
      return result.url;
    },
    onSuccess: (url) => window.open(url, "_blank", "noopener"),
    onError: (e: Error) => toast.error(e.message),
  });

  const s = summaryQ.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-6 flex flex-col gap-2 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Membership
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          My account
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your plan, billing, benefits, guardians and activity — everything BeistandPlus knows
          about your household, on one page.
        </p>
      </header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="activity">Activity log</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {summaryQ.isLoading ? (
            <SkeletonCards />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={<Receipt className="h-4 w-4" />}
                label="Plan"
                value={s?.subscription?.plan?.name ?? "No plan"}
                sub={
                  s?.subscription
                    ? `${fmtEur(s.subscription.plan?.monthly_price_eur)}/mo · ${s.subscription.status}`
                    : "Upgrade to unlock benefits"
                }
                action={
                  s?.subscription ? (
                    <Button size="sm" variant="outline" onClick={() => openPortal.mutate()} disabled={openPortal.isPending}>
                      Manage <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => navigate({ to: "/app/upgrade" })}>
                      Choose plan <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )
                }
              />
              <StatCard
                icon={<FileText className="h-4 w-4" />}
                label="Vault documents"
                value={String(s?.documents.length ?? 0)}
                sub="Encrypted at rest · audit logged"
                action={
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/documents">Open vault</Link>
                  </Button>
                }
              />
              <StatCard
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Deputies & key holders"
                value={String(s?.deputies.filter((d) => d.status === "accepted").length ?? 0)}
                sub={`${s?.deputies.length ?? 0} nominated`}
                action={
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/documents">Manage</Link>
                  </Button>
                }
              />
              <StatCard
                icon={<Activity className="h-4 w-4" />}
                label="Open cases"
                value={String(
                  s?.cases.filter((c) => !["closed", "resolved", "cancelled"].includes(c.status ?? "")).length ?? 0,
                )}
                sub={`${s?.cases.length ?? 0} total`}
                action={
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/cases">Open cases</Link>
                  </Button>
                }
              />
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Household members"
                value={String(s?.familyMembers.length ?? 0)}
                sub={`${s?.trustedContacts.length ?? 0} trusted contacts`}
                action={
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/profile">Household</Link>
                  </Button>
                }
              />
              <StatCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Benefits claimed"
                value={String((s?.insuranceLeads.length ?? 0) + (s?.taxLeads.length ?? 0))}
                sub="Insurance + tax leads"
                action={
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/benefits">See eligibility</Link>
                  </Button>
                }
              />
            </div>
          )}
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing" className="space-y-4">
          <BillingPanel
            summary={s}
            loading={summaryQ.isLoading}
            onOpenPortal={() => openPortal.mutate()}
            portalPending={openPortal.isPending}
          />
        </TabsContent>

        {/* BENEFITS */}
        <TabsContent value="benefits" className="space-y-4">
          <BenefitsPanel summary={s} loading={summaryQ.isLoading} />
        </TabsContent>

        {/* HOUSEHOLD */}
        <TabsContent value="household" className="space-y-4">
          <HouseholdPanel summary={s} loading={summaryQ.isLoading} />
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityPanel rows={auditQ.data ?? []} loading={auditQ.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {props.icon} {props.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="font-display text-2xl font-semibold tracking-tight">{props.value}</div>
        <p className="text-xs text-muted-foreground">{props.sub}</p>
        {props.action && <div className="pt-1">{props.action}</div>}
      </CardContent>
    </Card>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

function BillingPanel({
  summary,
  loading,
  onOpenPortal,
  portalPending,
}: {
  summary: any;
  loading: boolean;
  onOpenPortal: () => void;
  portalPending: boolean;
}) {
  if (loading) return <Skeleton className="h-48 w-full" />;
  const sub = summary?.subscription;
  if (!sub) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No active subscription</CardTitle>
          <CardDescription>Choose a plan to unlock case management, vault deputies and benefits assistance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/app/upgrade">See plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const price = sub.plan?.monthly_price_eur ?? null;
  const isCanceling = sub.cancel_at_period_end === true;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {sub.plan?.name ?? sub.plan_code ?? "Plan"}
            <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
            {isCanceling && <Badge variant="destructive">Cancels at period end</Badge>}
          </CardTitle>
          <CardDescription>{sub.plan?.tagline ?? "Household membership"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="space-y-1.5 text-sm">
            <Row label="Monthly amount" value={fmtEur(price)} />
            <Row label="Current period" value={`${fmtDate(sub.current_period_start)} → ${fmtDate(sub.current_period_end)}`} />
            <Row label="Next charge" value={isCanceling ? "— (cancelled)" : fmtDate(sub.current_period_end)} />
            <Row label="Environment" value={sub.environment ?? "sandbox"} />
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={onOpenPortal} disabled={portalPending}>
              {portalPending ? "Opening…" : "Manage billing"} <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/upgrade">Change plan</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Invoices, receipts and payment methods live in the Stripe customer portal (opens in a new tab).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What&rsquo;s included</CardTitle>
          <CardDescription>Everything covered by your current tier.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(sub.plan?.features ?? []).map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{f}</span>
              </li>
            ))}
            {!(sub.plan?.features?.length) && (
              <li className="text-muted-foreground">Plan features not loaded.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function BenefitsPanel({ summary, loading }: { summary: any; loading: boolean }) {
  const verdicts = useMemo(() => {
    // Best-effort quick eligibility snapshot from household size + insurance leads
    if (!summary) return [];
    return evaluateBenefits({
      householdSize: Math.max(1, 1 + (summary.familyMembers?.length ?? 0)),
      childrenUnder18: (summary.familyMembers ?? []).filter(
        (m: any) => (m.relationship ?? "").toLowerCase().includes("child"),
      ).length,
      residence: "other",
      monthlyIncome: 3000,
      employment: "employed",
      housing: "rented",
    });
  }, [summary]);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Benefits claimed</CardTitle>
          <CardDescription>Insurance quotes and tax filings we hold for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...(summary?.insuranceLeads ?? []), ...(summary?.taxLeads ?? [])].length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims on record yet. Explore your benefits from the sidebar.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {(summary?.insuranceLeads ?? []).map((l: any) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">Insurance</Badge>
                    <span>{l.product_line ?? "—"}</span>
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      {l.estimated_premium_min != null && l.estimated_premium_max != null
                        ? `${fmtEur(l.estimated_premium_min)}–${fmtEur(l.estimated_premium_max)}/mo`
                        : ""}
                    </span>
                    <Badge variant="secondary">{l.status ?? "—"}</Badge>
                    <span>{fmtDate(l.created_at)}</span>
                  </span>
                </li>
              ))}
              {(summary?.taxLeads ?? []).map((l: any) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">Tax</Badge>
                    <span>Steuererklärung {l.tax_year ?? ""}</span>
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>{l.estimated_refund_eur ? `+${fmtEur(l.estimated_refund_eur)} est.` : ""}</span>
                    <Badge variant="secondary">{l.status ?? "—"}</Badge>
                    <span>{fmtDate(l.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>You may also be eligible for</CardTitle>
          <CardDescription>
            Rough estimate from household size — refine on the{" "}
            <Link to="/app/benefits" className="underline">
              full eligibility check
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {verdicts.filter((v) => v.eligible).slice(0, 8).map((v) => (
              <li key={v.key} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{v.key.replace(/_/g, " ")}</span>
                  <Badge variant={v.confidence === "likely" ? "default" : "secondary"}>
                    {v.confidence}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{v.amountLabel}</p>
              </li>
            ))}
            {verdicts.filter((v) => v.eligible).length === 0 && (
              <li className="col-span-full text-sm text-muted-foreground">
                Complete your household profile to see estimates.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function HouseholdPanel({ summary, loading }: { summary: any; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full" />;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Family members</CardTitle>
          <CardDescription>People covered by your household plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {(summary?.familyMembers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No family members added yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.familyMembers.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                  <span>
                    <span className="font-medium">{m.full_name}</span>{" "}
                    <span className="text-muted-foreground">· {m.relationship ?? "—"}</span>
                  </span>
                  {m.covered_by_subscription && <Badge variant="secondary">covered</Badge>}
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to="/app/profile">Manage household</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deputies & vault key-holders</CardTitle>
          <CardDescription>Who can access your vault and under what rule.</CardDescription>
        </CardHeader>
        <CardContent>
          {(summary?.deputies ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No deputies nominated yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.deputies.map((d: any) => (
                <li key={d.id} className="rounded-md border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.full_name ?? d.invite_email}</span>
                    <Badge variant={d.status === "accepted" ? "default" : "secondary"}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Rule: {d.access_rule} · Categories: {(d.allowed_categories ?? []).join(", ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to="/app/documents">Manage deputies</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Case history</CardTitle>
          <CardDescription>All cases opened for your household.</CardDescription>
        </CardHeader>
        <CardContent>
          {(summary?.cases ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {summary.cases.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <Link to={`/app/cases/${c.id}` as any} className="font-medium hover:underline">
                      {c.title ?? c.reference ?? "Untitled case"}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      · {c.case_type ?? "case"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <Badge variant="secondary">{c.status}</Badge>
                    <span>{fmtDate(c.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityPanel({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!rows.length)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No activity yet. Every access to your vault, deputy change, case update or membership change appears here.
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity log</CardTitle>
        <CardDescription>
          Every important action on your account, most recent first. Retained for 6 years for compliance.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 px-6 py-3 text-sm">
              <ActivityIcon action={r.action} />
              <div>
                <div className="font-medium">{humanAction(r.action)}</div>
                <div className="text-xs text-muted-foreground">
                  {r.entity_type ? `${r.entity_type}` : ""}
                  {r.entity_id ? ` · ${r.entity_id.slice(0, 8)}…` : ""}
                  {r.actor_email ? ` · by ${r.actor_email}` : ""}
                </div>
              </div>
              <time className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const cls = "mt-0.5 h-4 w-4";
  if (/deny|fail|error|revoke/i.test(action)) return <AlertCircle className={`${cls} text-destructive`} />;
  if (/pend|wait|request/i.test(action)) return <Clock className={`${cls} text-amber-500`} />;
  return <CheckCircle2 className={`${cls} text-emerald-600`} />;
}
function humanAction(a: string) {
  return a.replace(/_/g, " ").replace(/\./g, " → ").replace(/^./, (c) => c.toUpperCase());
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
