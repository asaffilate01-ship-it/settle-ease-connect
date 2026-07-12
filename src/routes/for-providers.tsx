import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Building2, Church, Landmark, Hospital, Plane, Scale, Shield, Car, Baby, Heart, GraduationCap, Home } from "lucide-react";

export const Route = createFileRoute("/for-providers")({
  head: () => ({
    meta: [
      { title: "For providers — BeistandPlus" },
      { name: "description", content: "Join Germany's largest cross-faith welfare and end-of-life network. Portals for funeral directors, mosques, churches, temples and gurdwaras." },
      { property: "og:title", content: "For providers — BeistandPlus" },
      { property: "og:description", content: "Get verified referrals, manage cases, and grow your practice with BeistandPlus." },
    ],
  }),
  component: ForProviders,
});

const portals = [
  { icon: Building2, title: "Funeral Director portal", desc: "Referrals · quotes · invoices · death certificates · family chat · reviews · analytics." },
  { icon: Church, title: "Mosque portal", desc: "Janazah booking · imam scheduling · burial requests · volunteer allocation · announcements." },
  { icon: Church, title: "Church portal", desc: "Funeral service booking · priest scheduling · cemetery coordination." },
  { icon: Landmark, title: "Temple / Gurdwara portal", desc: "Ceremony booking · representative scheduling · community notifications." },
  { icon: Hospital, title: "Hospital integration", desc: "Secure certification handoff and mortuary handover." },
  { icon: Plane, title: "Airline / cargo partner", desc: "Repatriation booking automation and documentation." },
  { icon: Scale, title: "Lawyer / translator directory", desc: "Verified referrals for migration cases and translations." },
  { icon: Shield, title: "Insurance providers", desc: "Funeral expense cover on death, life, health and liability policies matched to families at the right life stage." },
  { icon: Car, title: "Driving instructors", desc: "Führerschein lessons, theory prep and licence conversion for new arrivals — bookings, progress tracking and invoices." },
  { icon: Baby, title: "Kita & childcare", desc: "Kita placement, tagesmutter referrals and parental leave paperwork support." },
  { icon: Heart, title: "Marriage & family services", desc: "Standesamt appointments, wedding celebrants, mediators and couples counsellors." },
  { icon: GraduationCap, title: "Education & language schools", desc: "Integration courses, German language schools, Anerkennung of foreign qualifications and tutoring." },
  { icon: Home, title: "Relocation & housing", desc: "Anmeldung, tenancy contracts, movers and short-term accommodation for new arrivals." },
];

function ForProviders() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Provider network
        </div>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Build your practice. Stand with your community.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          BeistandPlus is quietly building Germany's first cross-faith welfare and
          bereavement network. Joining is <strong>free for providers</strong> —
          no subscription, no listing fee. In return, you commit wholesale
          rates on the services you already offer, and we pass them through to
          families at fair, transparent prices.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
            <Link to="/contact">Apply to join</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/app">Preview the portal</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((p) => (
            <div key={p.title} className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent/15 text-accent-foreground">
                <p.icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-display text-xl font-semibold">{p.title}</div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Access</span>
                <span className="font-display text-sm font-semibold text-success">Free to join</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
