import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Building2, Church, Landmark, Hospital, Plane, Scale, Car, Baby, Heart, GraduationCap, Home } from "lucide-react";

export const Route = createFileRoute("/for-providers")({
  head: () => ({
    meta: [
      { title: "For providers — BeistandPlus" },
      { name: "description", content: "Join Germany's largest cross-faith welfare and end-of-life network. Portals for funeral directors, mosques, churches, temples and gurdwaras." },
      { property: "og:title", content: "For providers — BeistandPlus" },
      { property: "og:description", content: "Get verified referrals, manage cases, and grow your practice with BeistandPlus." },
      { property: "og:url", content: "https://beistandplus.de/for-providers" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/for-providers" }],
  }),
  component: ForProviders,
});

const portals: Array<{
  icon: typeof Building2;
  title: string;
  desc: string;
  features: string[];
  serves: string;
}> = [
  {
    icon: Building2,
    title: "Funeral Director portal",
    desc: "Run bereavement cases end-to-end with vetted families ready to instruct.",
    features: [
      "Case inbox with family brief, faith rites and budget upfront",
      "Quotes, invoices and death-certificate handling in one thread",
      "Secure family chat with in-app translation (13 languages)",
      "Reviews, response-time analytics and repeat-family pipeline",
    ],
    serves: "Bereaved families across Germany",
  },
  {
    icon: Church,
    title: "Mosque portal",
    desc: "Coordinate Janazah, ghusl and burial logistics without WhatsApp chaos.",
    features: [
      "Janazah slot booking with imam and washer scheduling",
      "Burial-plot and cemetery liaison workflow",
      "Volunteer roster and community announcements",
      "Direct handover to partner funeral directors",
    ],
    serves: "Muslim families and community members",
  },
  {
    icon: Church,
    title: "Church portal",
    desc: "Booking and coordination for funeral services and memorials.",
    features: [
      "Service booking with priest / pastor availability",
      "Cemetery and crematorium coordination",
      "Order-of-service and hymn-sheet templates",
      "Family aftercare and grief-support referrals",
    ],
    serves: "Christian congregations of all denominations",
  },
  {
    icon: Landmark,
    title: "Temple / Gurdwara portal",
    desc: "Ceremony booking and representative scheduling for Hindu, Sikh and Buddhist rites.",
    features: [
      "Antim Sanskar, Antam Sanskar and puja scheduling",
      "Granthi / pandit / monk availability calendar",
      "Cremation and ash-scattering coordination",
      "Community notification broadcasts",
    ],
    serves: "Hindu, Sikh and Buddhist families",
  },
  {
    icon: Hospital,
    title: "Hospital integration",
    desc: "Secure handoff from ward to mortuary to funeral director.",
    features: [
      "Digital Todesbescheinigung handoff",
      "Mortuary release and next-of-kin verification",
      "Faith-sensitive body handling flags",
      "Bereavement liaison contact card for staff",
    ],
    serves: "Hospitals, hospices and palliative wards",
  },
  {
    icon: Plane,
    title: "Airline / cargo partner",
    desc: "Repatriation bookings with documentation done right the first time.",
    features: [
      "Route and price quoting for human remains cargo",
      "Consular, embassy and zinc-liner document checklist",
      "Live status updates shared with the family",
      "Standing corridor agreements for common destinations",
    ],
    serves: "Repatriation to 40+ countries",
  },
  {
    icon: Scale,
    title: "Lawyer / translator directory",
    desc: "Verified referrals for migration, probate and sworn translations.",
    features: [
      "Case briefs pre-qualified by our case managers",
      "Aufenthalt, Einbürgerung, Erbschaft and family-law tracks",
      "Sworn (beeidigt) translator matching by language pair",
      "Fixed-fee or hourly billing through the platform",
    ],
    serves: "Migrants, expats and bereaved next of kin",
  },
  {
    icon: Car,
    title: "Driving instructors",
    desc: "Führerschein lessons, theory prep and EU licence conversion for new arrivals.",
    features: [
      "Lesson booking, progress tracking and invoices",
      "Theory-test prep in the student's first language",
      "Umschreibung paperwork guidance",
      "Fleet and school-wide dashboards",
    ],
    serves: "New arrivals and young adults",
  },
  {
    icon: Baby,
    title: "Kita & childcare",
    desc: "Placement, tagesmutter referrals and parental-leave paperwork support.",
    features: [
      "Waitlist and Kita-Gutschein handling",
      "Tagesmutter and au-pair matching",
      "Elterngeld / Kindergeld application help",
      "Parent onboarding in 13 languages",
    ],
    serves: "Families with children under 6",
  },
  {
    icon: Heart,
    title: "Marriage & family services",
    desc: "Standesamt appointments, celebrants, mediators and couples counsellors.",
    features: [
      "Standesamt document checklist and booking",
      "Multilingual wedding celebrants",
      "Mediation and couples counselling referrals",
      "Prenuptial and family-law legal handoff",
    ],
    serves: "Couples and families at every stage",
  },
  {
    icon: GraduationCap,
    title: "Education & language schools",
    desc: "Integration courses, German language schools and qualification recognition.",
    features: [
      "BAMF Integrationskurs enrolment support",
      "A1–C2 German courses with placement testing",
      "Anerkennung of foreign qualifications",
      "Private tutoring and Nachhilfe matching",
    ],
    serves: "Learners aged 6 to 60+",
  },
  {
    icon: Home,
    title: "Relocation & housing",
    desc: "Anmeldung, tenancy, movers and short-term accommodation for new arrivals.",
    features: [
      "Anmeldung appointment booking and forms",
      "Tenancy contract and Schufa guidance",
      "Vetted movers with fixed-price quotes",
      "Furnished short-stay while flat-hunting",
    ],
    serves: "New arrivals and internal movers",
  },
];

function ForProviders() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Provider network
        </div>
        <h1 className="display-hero text-balance mt-3 font-semibold">
          Build your practice. Stand with your community.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          BeistandPlus is quietly building Germany's first cross-faith welfare and
          bereavement network. We bring you pre-qualified families, handle the
          paperwork and translations, and let you focus on the work you do best —
          at wholesale rates we pass through transparently.
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
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border/60 pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Serves
                </div>
                <div className="mt-1 text-sm text-foreground/90">{p.serves}</div>
              </div>
            </div>
          ))}
        </div>
      </section>


      <SiteFooter />
    </div>
  );
}
