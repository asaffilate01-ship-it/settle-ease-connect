import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  HeartHandshake,
  Landmark,
  Briefcase,
  Home,
  Building2,
  Languages,
  Users,
  Truck,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Institutional partnerships — BeistandPlus" },
      {
        name: "description",
        content:
          "Five formal partnership tracks for universities, NGOs, banks, Jobcenters and social housing offices — with clear deliverables, integration paths and legal frameworks.",
      },
      { property: "og:title", content: "Institutional partnership hub — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Structured MOUs and API integrations for the German institutions that serve migrants: universities, NGOs, banks, Jobcenters, Wohnungsämter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnershipsHub,
});

type Track = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "Active" | "Piloting" | "MoU drafted" | "Discovery";
  intro: string;
  weBring: string[];
  theyBring: string[];
  integration: string[];
  legalBasis: string;
  targets: string[];
  contactEmail: string;
};

const tracks: Track[] = [
  {
    id: "universities",
    name: "Universities & Studierendenwerke",
    icon: GraduationCap,
    status: "MoU drafted",
    intro:
      "International student offices spend hundreds of hours per semester on repeat questions: health insurance switch, residence permit, tax number, opening a bank account. We plug into onboarding.",
    weBring: [
      "Multilingual settlement workspace pre-scoped for the student cohort (11 languages).",
      "Health insurance switch flow (public → private/expat) that respects the university's preferred providers.",
      "Bürgergeld / BAföG eligibility screener for students in hardship.",
      "Anonymised cohort dashboard for the International Office (drop-out risk signals).",
    ],
    theyBring: [
      "SSO handshake at enrolment (Shibboleth / OIDC) so no student re-types their data.",
      "Referral pathway from the International Office and Studierendenwerk.",
      "Access to student housing waiting-list APIs where available.",
    ],
    integration: [
      "OIDC login with enrolment claims (course, start date, home country).",
      "Webhook: on enrolment → create case + assign onboarding checklist.",
      "Read-only export back to the university's SIS for consented students.",
    ],
    legalBasis:
      "Auftragsverarbeitungsvertrag (Art. 28 GDPR) + Datenschutzfolgenabschätzung. Data stays in EU (Frankfurt).",
    targets: [
      "TU Berlin",
      "LMU München",
      "RWTH Aachen",
      "Universität Hamburg",
      "Freie Universität Berlin",
      "Studierendenwerk Berlin",
    ],
    contactEmail: "universities@beistand.de",
  },
  {
    id: "ngos",
    name: "NGOs, Wohlfahrtsverbände & Migrantenselbstorganisationen",
    icon: HeartHandshake,
    status: "Active",
    intro:
      "Diakonie, Caritas, AWO, Paritätischer, DRK and the Migrantenorganisationen already carry the load. We give their caseworkers a shared workspace so nothing falls through the cracks.",
    weBring: [
      "Multi-tenant caseworker portal — one login, many families, full audit trail.",
      "Free tier for accredited NGO caseworkers (no seat licence).",
      "Structured intake for Sozialbestattung, Wohngeld, Bürgergeld and legal aid.",
      "Warm handover to our vetted expert roster when the NGO's mandate ends.",
    ],
    theyBring: [
      "Trusted-referral pipeline for hardship cases.",
      "Local knowledge on Ausländerbehörde practice by city.",
      "Co-authored regulation SOPs in our knowledge base.",
    ],
    integration: [
      "SCIM user provisioning for caseworker orgs (>10 seats).",
      "CSV / API export of anonymised case outcomes for the NGO's reporting to funders.",
      "Signal / secure-message bridge for time-critical alerts.",
    ],
    legalBasis:
      "Kooperationsvereinbarung + Art. 28 AVV. Sozialgeheimnis §35 SGB I respected end-to-end.",
    targets: [
      "Diakonie Deutschland",
      "Deutscher Caritasverband",
      "AWO Bundesverband",
      "Paritätischer Gesamtverband",
      "Deutsches Rotes Kreuz",
      "TGD (Türkische Gemeinde)",
      "ZMD (Zentralrat der Muslime)",
    ],
    contactEmail: "ngo@beistand.de",
  },
  {
    id: "banks",
    name: "Banks & Fintechs",
    icon: Landmark,
    status: "Discovery",
    intro:
      "New arrivals need a Girokonto within days — often before they have a Meldebescheinigung. We route qualified, KYC-ready applicants and share the settlement context banks can't see.",
    weBring: [
      "Pre-verified identity + address artefacts (Meldebescheinigung, Aufenthaltstitel) uploaded by the customer with consent.",
      "Segmented lead flow: students, skilled workers (§18a AufenthG), family reunification, refugees.",
      "In-app account-opening deep links with prefilled data.",
      "Post-onboarding: reminders for SCHUFA build-up and salary account switching.",
    ],
    theyBring: [
      "Deep link / partner API for account opening (Postident or VideoIdent skipped where possible).",
      "Referral revenue share for successful onboardings (transparent, disclosed to the user).",
      "Product feed: overdraft, credit card, sub-account for rent.",
    ],
    integration: [
      "OAuth deep link with signed state parameter (partner ID + campaign).",
      "Server-to-server webhook on account opened / KYC failed.",
      "Optional: FinTS/HBCI read-only for the household budget module (opt-in).",
    ],
    legalBasis:
      "Vermittler-Vertrag §2 KWG scope check with partner's Compliance. GwG-compliant data handover. BaFin-Merkblatt für Kontovermittlung respected.",
    targets: ["N26", "Deutsche Bank", "Commerzbank", "DKB", "ING", "bunq", "Tomorrow", "Vivid"],
    contactEmail: "banking@beistand.de",
  },
  {
    id: "jobcenter",
    name: "Bundesagentur für Arbeit & Jobcenter",
    icon: Briefcase,
    status: "Piloting",
    intro:
      "Bürgergeld intake still means paper forms and 45-minute Termine. We pre-fill the SGB II application, translate the Mitwirkungspflichten and keep the family on top of every deadline.",
    weBring: [
      "Bürgergeld / Wohngeld / Kinderzuschlag eligibility screener with plain-language explanations.",
      "SGB II main and supplementary forms (KDU, EK) pre-filled from the user's vault.",
      "Deadline tracker for Mitwirkungspflichten, Weiterbewilligung and Widerspruch (§84 SGG).",
      "Multilingual explainer for every Bescheid the family uploads.",
    ],
    theyBring: [
      "e-Akte upload endpoint (BA Fachverfahren VerBIS / ALLEGRO where available).",
      "Termin booking API for the local Jobcenter.",
      "Certified translation stamp for our translator partners.",
    ],
    integration: [
      "Signed PDF/A upload to the Jobcenter's e-Akte inbox.",
      "iCal / ICS feed of Termine into the user's calendar.",
      "Two-way status sync (Antrag eingegangen → Bescheid erlassen) via webhook.",
    ],
    legalBasis:
      "§80 SGB X Datenverarbeitung im Auftrag. Pilot governed by BA Innovationslabor Rahmenvereinbarung.",
    targets: [
      "Jobcenter Berlin Mitte (pilot)",
      "Jobcenter Hamburg",
      "Jobcenter München",
      "Bundesagentur für Arbeit — Zentrale Nürnberg",
    ],
    contactEmail: "jobcenter@beistand.de",
  },
  {
    id: "housing",
    name: "Wohnungsämter & Social Housing",
    icon: Home,
    status: "MoU drafted",
    intro:
      "The WBS (Wohnberechtigungsschein) is the single biggest unlock for affordable housing — and the single most confusing form. We do the eligibility maths, the family does one signature.",
    weBring: [
      "WBS eligibility calculator (Einkommensgrenzen §9 WoFG, family size, disability adjustments).",
      "Pre-filled WBS Antrag + supporting document bundle.",
      "Waiting-list intake pack for municipal housing companies (Vonovia SPRINT-alternatives, städtische Wohnungsbaugesellschaften).",
      "Multilingual tenant-rights guide (Kündigung, Mieterhöhung, Betriebskosten).",
    ],
    theyBring: [
      "Municipal WBS intake API (city-by-city) or bulk PDF/A submission channel.",
      "Priority list access for households scoring §22 SGB II hardship.",
      "Referral to city-owned Wohnungsbaugesellschaften.",
    ],
    integration: [
      "Direct submission to the Wohnungsamt's Fachverfahren (OSCI-Transport where mandated).",
      "Status webhook: Antrag eingegangen → WBS ausgestellt → Wohnung angeboten.",
      "Anonymised waiting-time analytics fed back to the city.",
    ],
    legalBasis:
      "Verwaltungsvereinbarung §5 EGovG. City retains data ownership; we act as processor under Art. 28 GDPR.",
    targets: [
      "Wohnungsamt Berlin",
      "Wohnungsamt Hamburg",
      "Sozialreferat München",
      "Wohnungsamt Frankfurt",
      "Amt für Wohnungswesen Köln",
      "degewo",
      "GEWOBAG",
      "SAGA Hamburg",
    ],
    contactEmail: "housing@beistand.de",
  },
];

const statusStyles: Record<Track["status"], string> = {
  Active: "bg-green-500/10 text-green-700 border-green-500/20",
  Piloting: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "MoU drafted": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Discovery: "bg-muted text-muted-foreground border-border",
};

function PartnershipsHub() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-24 text-center sm:px-6 lg:px-8">
        <Badge variant="outline" className="border-primary/30 text-primary">
          Institutional partnerships
        </Badge>
        <h1 className="display-hero text-balance mt-5 font-semibold leading-[1.05]">
          Five tracks.<br />
          <span className="italic text-primary">One trusted intake for migrants in Germany.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          We formalise partnerships with the five institution types that shape a
          migrant's first years in Germany. Every track has a written scope, a
          legal basis, an integration path and a named contact.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {tracks.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary/40"
            >
              <t.icon className="h-4 w-4 text-primary" />
              {t.name.split(" &")[0]}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-16 px-4 pb-24 sm:px-6 lg:px-8">
        {tracks.map((track) => (
          <article
            key={track.id}
            id={track.id}
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-8 shadow-soft sm:p-10"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <track.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {track.name}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{track.intro}</p>
                </div>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[track.status]}`}
              >
                {track.status}
              </span>
            </header>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-parchment/50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  What BeistandPlus brings
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {track.weBring.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-parchment/50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
                  What the partner brings
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {track.theyBring.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Integration path</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {track.integration.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Legal basis</h3>
                <p className="mt-2 text-sm text-muted-foreground">{track.legalBasis}</p>
                <h3 className="mt-4 text-sm font-semibold text-foreground">In active outreach</h3>
                <p className="mt-2 text-sm text-muted-foreground">{track.targets.join(" · ")}</p>
              </div>
            </div>

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
              <p className="text-sm text-muted-foreground">
                Named contact:{" "}
                <a href={`mailto:${track.contactEmail}`} className="text-primary hover:underline">
                  {track.contactEmail}
                </a>
              </p>
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${track.contactEmail}?subject=Partnership%20inquiry%20—%20${encodeURIComponent(track.name)}`}>
                  Start a conversation <ArrowRight className="ml-1 h-4 w-4 rtl-flip" />
                </a>
              </Button>
            </footer>
          </article>
        ))}
      </section>

      <section className="border-t border-border/60 bg-parchment/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold">Not on the list?</h2>
          <p className="mt-3 text-muted-foreground">
            We're open to Krankenkassen, Ausländerbehörden, employer relocation
            programmes and municipal integration offices. Bring the mandate; we
            bring the workflow.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href="mailto:partnerships@beistand.de">Email partnerships@beistand.de</a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/partners">See live API integrations</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
