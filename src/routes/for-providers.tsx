import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Church, HeartHandshake, Languages, Scale, Workflow } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-providers")({
  head: () => ({
    meta: [
      { title: "For service providers — BeistandPlus" },
      {
        name: "description",
        content:
          "Explore BeistandPlus case-coordination tools and request a provider onboarding conversation.",
      },
      { property: "og:title", content: "For service providers — BeistandPlus" },
      {
        property: "og:description",
        content:
          "A secure workspace for consent-based intake, documents, messages and case coordination.",
      },
      { property: "og:url", content: "https://beistandplus.de/for-providers" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/for-providers" }],
  }),
  component: ForProviders,
});

const providerTypes = [
  {
    icon: Building2,
    title: "Funeral and bereavement teams",
    copy: "Receive a structured family brief, coordinate documents and keep quotes, invoices and messages with the case.",
  },
  {
    icon: HeartHandshake,
    title: "Welfare and community organisations",
    copy: "Coordinate consent-based referrals and case handovers without relying on unsecured message threads.",
  },
  {
    icon: Church,
    title: "Faith and community coordinators",
    copy: "Record requested rites, contacts and logistics while the family remains in control of who can see the case.",
  },
  {
    icon: Scale,
    title: "Independent professionals",
    copy: "Review a scoped request and communicate with the client. Professional advice and engagement terms remain your responsibility.",
  },
  {
    icon: Languages,
    title: "Language support",
    copy: "Work from shared case context and help clients understand documents. Certified translations require the appropriate professional.",
  },
  {
    icon: Workflow,
    title: "Institutional case teams",
    copy: "Discuss a configured workflow for your organisation, subject to security review, a data agreement and an agreed operating model.",
  },
];

function ForProviders() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Provider workspace
          </p>
          <h1 className="display-hero mt-3 text-balance font-semibold">
            Clearer handovers. Less fragmented casework.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            BeistandPlus provides case-coordination software. Provider access, referral availability
            and integrations are enabled only after onboarding and an appropriate agreement.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
              <Link to="/contact">Request provider onboarding</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/trust">Review our controls</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {providerTypes.map((provider) => (
              <article
                key={provider.title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <provider.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">{provider.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{provider.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-parchment/40">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold">Before a workflow goes live</h2>
            <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <p>We confirm identity, role, organisation and the exact services being offered.</p>
              <p>
                Both sides agree access boundaries, retention, escalation and incident contacts.
              </p>
              <p>Regulated work stays with an appropriately authorised independent provider.</p>
              <p>Availability, prices and response times are confirmed in the signed agreement.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
