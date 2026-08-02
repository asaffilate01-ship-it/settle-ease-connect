import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/partners/insurers")({
  head: () => ({
    meta: [
      { title: "Prospective insurance referral partners — BeistandPlus" },
      {
        name: "description",
        content:
          "A non-binding discussion brief for licensed German insurance providers considering a referral pilot.",
      },
      { property: "og:title", content: "Insurance referral partnerships — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Explore a consent-based referral workflow with clear regulatory and service boundaries.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "https://beistandplus.de/partners/insurers" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/partners/insurers" }],
  }),
  component: PartnersInsurers,
});

const requirements = [
  "The receiving provider verifies and discloses its identity, permissions and complaints route.",
  "BeistandPlus remains a non-advisory introduction service unless a different authorised model is documented.",
  "The provider owns eligibility, suitability where applicable, underwriting, pricing, policy documents and claims.",
  "Client consent is recorded before personal data is transferred, with an agreed retention and deletion process.",
  "Any commission or commercial relationship is disclosed as required before the client decides.",
  "No live referral starts until legal, data-protection, security and operational approvals are complete.",
];

const pilotSteps = [
  ["Scope", "Agree product boundary, territories, client journey and accountable contacts."],
  [
    "Assure",
    "Review permissions, disclosures, DPIA/AVV needs, security controls and incident handling.",
  ],
  [
    "Integrate",
    "Use a sandbox endpoint or controlled manual handoff with idempotency and audit evidence.",
  ],
  [
    "Measure",
    "Track consent quality, delivery failures, complaints and client outcomes before expanding.",
  ],
];

function PartnersInsurers() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Badge variant="secondary" className="uppercase tracking-wider">
          Non-binding discussion brief
        </Badge>
        <h1 className="display-hero mt-4 max-w-4xl text-balance font-semibold">
          A transparent referral path for funeral-cover enquiries.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          BeistandPlus can prepare a client&apos;s enquiry and, where a service is activated,
          introduce them to an appropriately authorised German provider. We do not currently present
          a partner, policy, price, volume commitment or regulatory permission on this page.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Minimum launch conditions</h2>
            </div>
            <ul className="mt-6 space-y-4">
              {requirements.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Proposed pilot sequence</h2>
            <div className="mt-6 space-y-5">
              {pilotSteps.map(([title, copy], index) => (
                <div key={title} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <section className="mt-12 rounded-2xl border border-border/60 bg-parchment/40 p-7 sm:p-9">
          <h2 className="font-display text-2xl font-semibold">
            Start with evidence, not projections
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            A prospective provider can request a technical and operational walkthrough. Commercial
            terms, forecast volume and any exclusivity are discussed only after both sides validate
            the model and sign the necessary agreements.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/contact">Request a partnership discussion</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/trust">Review service boundaries</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
