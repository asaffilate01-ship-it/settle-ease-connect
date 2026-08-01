import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listPartnerStatus } from "@/lib/partners.functions";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partner integrations — BeistandPlus" },
      { name: "description", content: "Current integration readiness for BeistandPlus insurance, tax and interpreting workflows." },
      { property: "og:title", content: "Partner API integrations — BeistandPlus" },
      { property: "og:description", content: "See which external integrations are configured and which remain disabled." },
    ],
  }),
  component: Partners,
});

const roadmap = [
  { name: "Banking providers", category: "Banking", status: "Not connected", note: "Potential account-opening referral flow; no provider relationship is represented here." },
  { name: "Municipal housing offices", category: "Social housing", status: "Not connected", note: "Potential eligibility and appointment workflow; subject to public-sector approval." },
  { name: "Employment agencies", category: "Employment", status: "Not connected", note: "Potential form-preparation and appointment workflow; no agency integration is configured." },
  { name: "Universities", category: "Education", status: "Not connected", note: "Potential student-verification referrals; no university agreement is represented here." },
  { name: "Social support organisations", category: "NGO", status: "Not connected", note: "Potential hardship-case referral pathway; requires a signed operational agreement." },
];

function Partners() {
  const listStatus = useServerFn(listPartnerStatus);
  const { data, isLoading } = useQuery({ queryKey: ["partner-status"], queryFn: () => listStatus() });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-24 text-center sm:px-6 lg:px-8">
        <Badge variant="outline" className="border-primary/30 text-primary">Partner API layer</Badge>
        <h1 className="display-hero text-balance mt-5 font-semibold leading-[1.05]">
          One workflow.<br />
          <span className="italic text-primary">Every partner API behind it.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          External handoffs run through typed adapters. Missing credentials or
          partner outages fail closed, so an illustrative demo can never be
          mistaken for a real quote, filing or confirmed booking.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="display-lg text-balance font-semibold">Integration readiness</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Each adapter reports its server-side configuration status. Mock mode is
          available only when explicitly enabled during local development and is
          rejected by the production configuration check.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {isLoading || !data ? (
            <div className="col-span-full text-sm text-muted-foreground">Checking partner status…</div>
          ) : (
            data.map((p) => (
              <div key={p.slug} className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category}</div>
                    <div className="mt-1 font-display text-lg font-semibold">{p.name}</div>
                  </div>
                  <Badge
                    variant={p.mode === "live" ? "default" : "outline"}
                    className={p.mode === "live" ? "" : "border-amber-500/40 text-amber-700 dark:text-amber-400"}
                  >
                    {p.mode}
                  </Badge>
                </div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">
                  {p.gap ?? "Configured. Upstream failures are shown as unavailable and never replaced with invented results."}
                </p>
                <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {p.configured ? "Configured" : "Awaiting credentials"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-16">
          <h2 className="display-lg text-balance font-semibold">Adapter contract</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every partner implements one of three narrow interfaces — quote,
            handoff, or booking — and lives under <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/lib/partners/*</code>.
            Adding a new partner is a single file plus one entry in the
            server-function registry.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { t: "Quote", d: "Insurance and any product where price depends on the person. Returns premium + commission + deep link." },
              { t: "Handoff", d: "Tax, banking, immigration — where the partner owns the wizard. Returns a pre-filled URL and estimate." },
              { t: "Booking", d: "Interpreting, care visits, ceremony slots. Returns a confirmed booking with cost and cancellation policy." },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="font-semibold">{c.t}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="display-lg text-balance font-semibold">Potential integration tracks</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Product concepts only. A named category does not imply a contract,
            endorsement, data-sharing agreement or live connection.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {roadmap.map((r) => (
                  <tr key={r.name} className="border-t border-border/60">
                    <td className="px-5 py-3 font-medium">{r.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-[11px]">{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-3">
          <Button asChild>
            <a href="mailto:partners@beistandplus.de">Become a partner</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/trust">Compliance & vetting</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/insurance">Try the insurance flow</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Formal SLAs, uptime targets and data-processing addenda are shared under NDA on request.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
