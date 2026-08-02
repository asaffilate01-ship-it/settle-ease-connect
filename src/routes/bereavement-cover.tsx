import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FuneralCoverPlans } from "@/components/funeral-cover-plans";
import { RegulatedNotice } from "@/components/regulated-notice";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bereavement-cover")({
  head: () => ({
    meta: [
      { title: "Funeral cover introductions — BeistandPlus" },
      {
        name: "description",
        content:
          "Prepare a funeral-cover enquiry and request an introduction to a licensed German provider.",
      },
      { property: "og:title", content: "Funeral cover introductions — BeistandPlus" },
      { property: "og:url", content: "https://beistandplus.de/bereavement-cover" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/bereavement-cover" }],
  }),
  component: BereavementCover,
});

function BereavementCover() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="uppercase tracking-wider">
            Provider-confirmed cover
          </Badge>
          <h1 className="display-hero mt-4 text-balance font-semibold">
            Understand the offer before you buy.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            We help organise the information a licensed provider needs. Benefits, premiums,
            eligibility, exclusions, waiting periods and claims handling come only from the
            provider's binding documents.
          </p>
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <FuneralCoverPlans />
        </section>
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-parchment/40 p-6">
            <h2 className="font-display text-2xl font-semibold">
              Looking for household or association cover?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send one structured brief. A licensed broker can then confirm whether a suitable group
              product exists.
            </p>
            <Button asChild className="mt-5">
              <Link to="/group-cover">
                View referral process <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        <RegulatedNotice domain="funeral" />
      </main>
      <SiteFooter />
    </div>
  );
}
