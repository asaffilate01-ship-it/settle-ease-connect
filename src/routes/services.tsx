import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Home, FileText, Users, Briefcase, Building, HeartPulse, GraduationCap, Scale, Flower2 } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Beistand" },
      { name: "description", content: "Welfare, benefits, immigration, employment, housing, healthcare, community and end-of-life care in Germany." },
      { property: "og:title", content: "Services — Beistand" },
      { property: "og:description", content: "Every service a new arrival or long-time resident in Germany needs, in one place." },
    ],
  }),
  component: Services,
});

const groups = [
  {
    icon: Home,
    title: "Settlement & registration",
    items: ["Anmeldung", "Tax ID", "Bank account", "Health insurance", "SIM & internet", "Utilities", "Deutschlandticket"],
  },
  {
    icon: FileText,
    title: "Government & benefits",
    items: ["Bürgergeld", "Kindergeld", "Wohngeld", "Elterngeld", "Pension guidance", "Residence permits", "Visa reminders"],
  },
  {
    icon: Scale,
    title: "Immigration",
    items: ["Blue Card", "Family reunification", "Permanent residence", "Citizenship tracker", "Ausländerbehörde bookings"],
  },
  {
    icon: Briefcase,
    title: "Employment",
    items: ["German CV builder", "Job matching", "Apprenticeships", "Interview prep", "Skilled trades", "Delivery & driver jobs"],
  },
  {
    icon: Building,
    title: "Housing",
    items: ["Apartments & WG", "Social housing advice", "Deposit loans", "Landlord references", "Utility setup"],
  },
  {
    icon: HeartPulse,
    title: "Healthcare",
    items: ["English- & Urdu-speaking doctors", "Insurance comparison", "Mental health support", "Pregnancy services"],
  },
  {
    icon: Users,
    title: "Community",
    items: ["Mosque finder", "Prayer times", "Halal restaurants", "Islamic schools", "Women's groups", "Youth clubs"],
  },
  {
    icon: GraduationCap,
    title: "Students",
    items: ["Admission support", "Blocked account", "BAföG", "Student jobs", "Semester ticket", "Exam letter help"],
  },
  {
    icon: Flower2,
    title: "Burials, cremations & last rites",
    items: [
      "Erdbestattung (earth burial)",
      "Feuerbestattung (cremation) + 2. Leichenschau",
      "Urnenbeisetzung & columbarium",
      "Islamic burial (Qibla-aligned, sargloses Bestatten)",
      "Jewish burial (Chevra Kadisha)",
      "Hindu / Sikh cremation + ashes export",
      "Baumbestattung / Ruheforst / Seebestattung",
      "Sozialbestattung (§74 SGB XII)",
      "International repatriation",
    ],
  },
];

function Services() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">Services</div>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Everything you need, from day one.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Whatever season of life you're in, Beistand covers it — and knows
            when to bring in the right specialist.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <g.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{g.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {g.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
