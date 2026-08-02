import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  HeartHandshake,
  Home,
  Languages,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Prospective partnerships — BeistandPlus" },
      {
        name: "description",
        content:
          "Discuss a consent-based case-coordination pilot with BeistandPlus. No organisation shown is implied to be a current partner.",
      },
      { property: "og:title", content: "Prospective partnerships — BeistandPlus" },
      {
        property: "og:description",
        content:
          "A transparent path from discovery and data review to a measured case-coordination pilot.",
      },
      { property: "og:url", content: "https://beistandplus.de/partnerships" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/partnerships" }],
  }),
  component: PartnershipsHub,
});

const tracks = [
  {
    icon: GraduationCap,
    name: "Universities and education",
    useCase:
      "Optional onboarding checklists and consent-based support referrals for international learners.",
  },
  {
    icon: HeartHandshake,
    name: "Welfare and community organisations",
    useCase: "Structured intake and controlled handovers when a case moves between organisations.",
  },
  {
    icon: Briefcase,
    name: "Employers and recruiters",
    useCase:
      "A settlement workspace for international hires, with employee-controlled data sharing.",
  },
  {
    icon: Home,
    name: "Relocation teams",
    useCase:
      "Coordinate post-arrival tasks and document requests after the physical move is complete.",
  },
  {
    icon: Languages,
    name: "Language and training providers",
    useCase:
      "Connect course or translation requests to a case after the client has given explicit consent.",
  },
  {
    icon: Building2,
    name: "Public-sector and institutional teams",
    useCase:
      "Explore a narrowly scoped workflow subject to procurement, legal and security review.",
  },
];

const stages = [
  ["1", "Discovery", "Confirm the real user problem, service boundary and accountable owners."],
  ["2", "Data review", "Document lawful basis, minimisation, retention, access and deletion."],
  [
    "3",
    "Sandbox pilot",
    "Test with synthetic or approved low-risk data and measurable success criteria.",
  ],
  [
    "4",
    "Go-live decision",
    "Sign the required agreements and approve support, security and incident processes.",
  ],
];

function PartnershipsHub() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-24 lg:px-8">
          <Badge variant="outline" className="border-primary/30 text-primary">
            Prospective partnerships
          </Badge>
          <h1 className="display-hero mt-5 text-balance font-semibold">
            Start with one controlled workflow.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The examples below are potential collaboration areas, not announcements of current
            contracts, integrations or endorsements. We confirm availability only in writing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contact">
                Propose a pilot <ArrowRight className="ml-1 h-4 w-4 rtl-flip" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/trust">Security and service boundaries</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <article
                key={track.name}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <track.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">{track.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{track.useCase}</p>
                <p className="mt-5 border-t border-border/60 pt-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                  Available for discovery
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-parchment/40">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                A responsible path to launch
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">Evidence before scale</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {stages.map(([number, title, copy]) => (
                <div key={number} className="rounded-2xl border border-border/60 bg-background p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {number}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
