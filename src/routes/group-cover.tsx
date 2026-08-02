import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, Scale, ShieldCheck, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RegulatedNotice } from "@/components/regulated-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/group-cover")({
  head: () => ({
    meta: [
      { title: "Funeral cover referrals — BeistandPlus" },
      {
        name: "description",
        content:
          "Request an introduction to a licensed German broker for individual or household funeral cover.",
      },
      { property: "og:title", content: "Funeral cover referrals — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Independent referral support; eligibility, premiums and policy terms are confirmed by the licensed provider.",
      },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/group-cover" }],
  }),
  component: GroupCoverPage,
});

const steps = [
  {
    icon: Users,
    title: "Tell us about the household",
    body: "Share only the details needed for a broker introduction and choose how you would like to be contacted.",
  },
  {
    icon: FileCheck2,
    title: "Review the provider documents",
    body: "The licensed provider confirms eligibility, benefit, exclusions, waiting periods, premiums and cancellation rights.",
  },
  {
    icon: Scale,
    title: "Decide without pressure",
    body: "No cover starts inside BeistandPlus. You accept the provider's regulated offer and policy documents directly.",
  },
];

function GroupCoverPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Badge variant="secondary" className="uppercase tracking-wider">
            Licensed-provider referral
          </Badge>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="display-hero text-balance font-semibold">
                Explore funeral cover with a regulated partner.
              </h1>
              <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
                BeistandPlus helps you prepare the enquiry and can introduce you to a licensed
                broker. We do not underwrite insurance, promise acceptance, set waiting periods or
                guarantee a payout time.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="bg-gradient-primary">
                  <Link to="/contact">
                    Request an introduction <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/bereavement">Bereavement support</Link>
                </Button>
              </div>
            </div>
            <Card className="border-primary/20 bg-primary/5 p-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-semibold">No invented quotations</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A price, benefit or policy status appears in your account only after it has been
                returned or confirmed by the contracted provider.
              </p>
            </Card>
          </div>
        </section>

        <section className="border-y border-border/60 bg-parchment/40">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
            {steps.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="mt-3 font-display text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <RegulatedNotice domain="insurance" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
