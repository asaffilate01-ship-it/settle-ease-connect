import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partner with BeistandPlus" },
      {
        name: "description",
        content:
          "Information for regulated providers and community organisations interested in a BeistandPlus referral partnership.",
      },
      { property: "og:title", content: "Partner with BeistandPlus" },
      {
        property: "og:description",
        content:
          "Explore the standards and onboarding process for a BeistandPlus referral partnership.",
      },
      { property: "og:url", content: "https://beistandplus.de/partners" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/partners" }],
  }),
  component: Partners,
});

const partnerTracks = [
  {
    title: "Regulated services",
    body: "Insurance, tax and legal referrals require confirmed authorisation, an executed agreement and an approved customer journey before activation.",
  },
  {
    title: "Care and interpreting",
    body: "Providers must document qualifications, safeguarding, service coverage, response expectations and appropriate insurance.",
  },
  {
    title: "Community organisations",
    body: "Public-interest and local organisations can discuss referral pathways that preserve consent and minimise shared personal data.",
  },
];

const onboardingSteps = [
  "Confirm the organisation, service area, licences and accountable contacts.",
  "Complete commercial, privacy, security and safeguarding due diligence.",
  "Agree the referral scope, disclosures, support process and data responsibilities.",
  "Test the customer journey in a non-production environment before approval.",
  "Enable production access only after written sign-off and ongoing monitoring are in place.",
];

function Partners() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-24 lg:px-8">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Partner enquiries
          </Badge>
          <h1 className="display-hero mt-5 text-balance font-semibold leading-[1.05]">
            Build a trusted referral pathway with BeistandPlus.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            We are preparing a carefully governed partner network for families navigating difficult
            administrative moments in Germany. This page describes the proposed onboarding standard;
            it does not represent that any named provider is currently integrated or endorsed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/contact">Discuss a partnership</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/trust">Review our trust approach</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {partnerTracks.map((track) => (
              <article
                key={track.title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <h2 className="font-display text-xl font-semibold">{track.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{track.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 grid gap-8 rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Activation standard
              </p>
              <h2 className="display-lg mt-3 text-balance font-semibold">
                Evidence first, production access last.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Customer-facing availability is enabled only for services that have completed the
                relevant legal, operational and technical checks. Unavailable services remain
                clearly unavailable rather than returning simulated quotes or bookings.
              </p>
            </div>
            <ol className="space-y-4">
              {onboardingSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 rounded-2xl bg-muted/50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Interested in working together?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Send your organisation name, service area and regulatory status through the contact
                form. A reply time is confirmed after the enquiry is reviewed.
              </p>
            </div>
            <Button asChild className="mt-5 shrink-0 sm:mt-0">
              <Link to="/contact">Contact BeistandPlus</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
