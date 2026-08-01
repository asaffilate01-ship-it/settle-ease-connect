import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
import { RegulatedNotice } from "@/components/regulated-notice";
  ArrowRight,
  PlaneTakeoff,
  FileCheck2,
  Building2,
  Wallet,
  Receipt,
  ShieldCheck,
  Home,
  Users,
  Clock,
  MapPin,
  Landmark,
  HeartPulse,
  Briefcase,
  GraduationCap,
  Package,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/leaving-germany")({
  head: () => ({
    meta: [
      { title: "Leaving Germany for good — the complete checklist | BeistandPlus" },
      {
        name: "description",
        content:
          "Every piece of paperwork you need before you leave Germany permanently: Abmeldung, tax farewell (Wegzugsteuer), health & pension exit, contract cancellations, bank & post, family & pets — guided in 13 languages.",
      },
      { property: "og:title", content: "Leaving Germany for good — the complete checklist" },
      {
        property: "og:description",
        content:
          "A calm, step-by-step guide to leaving Germany permanently: deregistration, tax, insurance, pensions, contracts, banks, family & pets — everything in one place, in your language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/leaving-germany" }],
  }),
  component: LeavingGermany,
});

function LeavingGermany() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Timeline />
      <Sections />
      <Warnings />
      <CTA />
      <RegulatedNotice domain="legal" />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.18_0.04_240)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_20%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            <PlaneTakeoff className="h-3.5 w-3.5" /> Wegzug · Leaving Germany
          </div>
          <h1 className="display-hero text-balance mt-4 font-semibold">
            Leaving Germany for good?{" "}
            <span className="text-teal">Nothing left behind.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/75">
            Abmeldung, Finanzamt farewell, Krankenkasse exit, pension export, contract
            cancellations, bank closure, post-forwarding, family and pets — one checklist,
            one case manager, in your language.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <HeroChip icon={FileCheck2}>25+ authorities notified</HeroChip>
            <HeroChip icon={ShieldCheck}>Wegzugsteuer screened</HeroChip>
            <HeroChip icon={Clock}>Start 90 days before you fly</HeroChip>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-teal text-[oklch(0.18_0.04_240)] hover:bg-teal/90">
              <Link to="/contact">
                Start my leaving plan <ArrowRight className="ml-2 h-4 w-4 rtl-flip" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#timeline">See the 90-day timeline</a>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
            What we handle for you
          </div>
          <ul className="mt-4 space-y-3 text-sm text-white/85">
            {[
              "Abmeldung at Bürgeramt (with translated confirmation)",
              "Finanzamt final tax return + Wegzugsteuer check",
              "Krankenkasse & long-term-care exit letters",
              "Deutsche Rentenversicherung — pension export or refund",
              "Cancel Miete, Strom, Gas, Internet, Handy, GEZ, gym, insurance",
              "Close or convert bank accounts, redirect DHL post 12 months",
              "Kita / Schule / Uni deregistration & Kindergeld stop",
              "Pet paperwork (EU pet passport, rabies titre, airline crate)",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
            Flat fee — nothing extra when a partner (tax advisor, notary, shipper) is
            needed; you see every third-party invoice in your case file.
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/85">
      <Icon className="h-3.5 w-3.5 text-teal" /> {children}
    </span>
  );
}

function Timeline() {
  const phases: {
    when: string;
    label: string;
    tasks: string[];
  }[] = [
    {
      when: "T‑90 to T‑60 days",
      label: "Plan & notify",
      tasks: [
        "Give notice on your lease (usually 3 months' Kündigungsfrist — send by registered mail, Einschreiben mit Rückschein)",
        "Notify employer / clients; check severance, holiday payout, non-compete clauses",
        "Ask HR for the Lohnsteuerbescheinigung and pension statement",
        "Check visa / permit implications with Ausländerbehörde — a Niederlassungserlaubnis lapses after 6 months abroad without a re-entry permit",
        "Get 3 international-move quotes; book pet vet appointments for rabies titre if needed",
      ],
    },
    {
      when: "T‑60 to T‑30 days",
      label: "Cancel & prepare",
      tasks: [
        "Cancel or transfer Strom, Gas, Internet, Handy, Rundfunkbeitrag (GEZ), streaming, gym, insurances — most contracts require Sonderkündigungsrecht with proof of Abmeldung",
        "Book Abmeldung appointment at Bürgeramt (available up to 7 days before departure in most cities)",
        "Request PD U1 from Bundesagentur für Arbeit if you may claim unemployment abroad; request PD U2 if exporting existing ALG",
        "Ask the Krankenkasse for a Versicherungszeitenbescheinigung (health-insurance history) and Auslandsanwartschaft if you may return within 5 years",
        "Order 5–10 certified translations of key documents (birth, marriage, diplomas) via a court-sworn translator",
      ],
    },
    {
      when: "T‑30 to T‑7 days",
      label: "Finalise paperwork",
      tasks: [
        "Do the Abmeldung — receive the Abmeldebestätigung (this is the master document; take 10 copies)",
        "File the final Steuererklärung with your Wegzugsdatum; a Steuerberater checks Wegzugsteuer for shareholders and high-value assets",
        "Close or convert bank accounts to non-resident status; keep one German IBAN if you have future refunds or pension coming",
        "Set up DHL Nachsendeauftrag (mail-forwarding abroad, 12 months) and update address at every insurer, pension fund, bank, and Steuernummer",
        "Terminate Kita / Schule / Uni; stop Kindergeld with Familienkasse; deregister the car (Kfz-Abmeldung) or export it with red plates",
      ],
    },
    {
      when: "T‑7 to T+30 days",
      label: "Fly & wrap up",
      tasks: [
        "Return keys, do the Übergabeprotokoll with the landlord, get the Kaution refund address confirmed in writing",
        "Hand over any remaining German paperwork to your case manager — we chase Kaution, tax refund and final utility bills after you land",
        "Register at the new country's consulate if required; German embassies can help forward late-arriving mail",
        "Enrol in the new health system on day 1 — a gap voids Auslandsanwartschaft on return",
        "File PD U2 / A1 / S1 forms if moving within EU/EEA/CH for portable social-security rights",
      ],
    },
  ];

  return (
    <section id="timeline" className="scroll-mt-24 bg-parchment/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
            90-day timeline
          </div>
          <h2 className="display-lg text-balance mt-3 font-semibold text-ink">
            Start 90 days before you fly.
          </h2>
          <p className="mt-3 text-sm text-foreground/80">
            Germany is contract-heavy: most cancellations need 1–3 months' notice and the
            Abmeldung is the master key that unlocks everything else (Sonderkündigungsrecht,
            tax farewell, pension export). Miss a step and it can cost hundreds of euros
            after you land.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {phases.map((p, i) => (
            <div
              key={p.when}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {p.when}
                  </div>
                  <div className="font-display text-lg font-semibold text-ink">
                    {p.label}
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
                {p.tasks.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sections() {
  const sections: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
    items: string[];
  }[] = [
    {
      icon: Building2,
      title: "Deregistration (Abmeldung)",
      body: "The Abmeldebestätigung is your master document — every downstream cancellation needs it. Book at any Bürgeramt in your city of residence; it can be done up to 7 days before departure and up to 14 days after.",
      items: [
        "Bring passport, Meldebescheinigung, and landlord confirmation if requested",
        "For families, one adult can abmelden the whole household with signed consent forms",
        "Ask for at least 5 stamped copies — banks, insurers and mobile carriers each want an original",
        "If you own property or run a Gewerbe, keep a c/o address to receive future mail",
      ],
    },
    {
      icon: Receipt,
      title: "Tax farewell (Finanzamt)",
      body: "You must file a final Steuererklärung for the year you leave with your Wegzugsdatum. Shareholders in a Kapitalgesellschaft or holders of >1% stakes should get advice on Wegzugsteuer (§6 AStG) — the deemed-sale tax can be substantial and is due immediately when leaving the EU/EEA.",
      items: [
        "Get an ELSTER certificate that works from abroad, or authorise a Steuerberater",
        "Keep your Steuer-ID — you will need it for any refund, even years later",
        "Request an Ansässigkeitsbescheinigung for the new country to avoid double taxation",
        "Church tax (Kirchensteuer) also ends on Abmeldung — no separate letter needed",
      ],
    },
    {
      icon: HeartPulse,
      title: "Health, pension & social insurance",
      body: "Your Krankenkasse membership ends the day of Abmeldung; you need cover in the new country from day 1 or you may face reinstatement penalties. Pension contributions can often be exported or, for non-EU citizens after 24 months, refunded in part.",
      items: [
        "Ask the Krankenkasse for a Versicherungsbescheinigung and, if returning, Auslandsanwartschaft",
        "Request the S1 form if moving within EU/EEA/CH — extends German cover briefly at your new address",
        "Contact Deutsche Rentenversicherung for a Rentenauskunft; export pension rights or apply for Beitragsrückerstattung if eligible",
        "For occupational pensions (bAV) and Riester / Rürup, confirm portability with each provider — some pay out only from age 62",
      ],
    },
    {
      icon: Wallet,
      title: "Contracts, banks & post",
      body: "Most German contracts (Strom, Gas, Internet, Handy, Rundfunk, gym) recognise a Sonderkündigungsrecht when you show the Abmeldebestätigung — this overrides normal notice periods.",
      items: [
        "Cancel every recurring SEPA debit with the Abmeldung date, and set up mail-forwarding via DHL Nachsendeauftrag for 6 or 12 months",
        "Keep one German bank account open for tax refunds, deposit returns and pension arrears; convert to non-resident status if the bank requires it",
        "Rundfunkbeitrag (GEZ) needs a separate Abmeldung form — the Bürgeramt does not do this automatically",
        "Update Steuernummer, insurer, and DRV address to the new country before you leave to avoid returned mail and interest charges",
      ],
    },
    {
      icon: Home,
      title: "Housing, utilities & the deposit",
      body: "Kaution recovery is the single most common post-departure complaint. Protect it with a written Übergabeprotokoll, photos of every room, and a forwarding address the landlord signs off on.",
      items: [
        "Give notice in writing by registered mail — WhatsApp or email does not count under German tenancy law",
        "Do the Auszug walk-through with the landlord; photograph meters, walls, floors, and appliances",
        "Ask for the deposit release schedule in writing — landlords may hold up to 6 months for pending Nebenkosten",
        "For Eigentum (owned property), decide before leaving: sell, rent out via a Hausverwaltung, or keep for a return — each has different tax consequences",
      ],
    },
    {
      icon: Users,
      title: "Family, Kita & school",
      body: "If children stay in the German school system a few extra months, keep the parents' Meldung active or arrange a c/o address; if the whole family leaves, one Abmeldung covers all household members and Kindergeld stops automatically.",
      items: [
        "Get certified copies of Abschlusszeugnis / Zwischenzeugnis in English — universities abroad will ask",
        "Familienkasse stops Kindergeld the month after Abmeldung; overpayments are clawed back — notify early",
        "For custody / split-family cases, get a notarised consent letter before moving the child abroad",
        "For Kitas, give the required Kündigungsfrist (usually 2 months) or you keep paying after you leave",
      ],
    },
    {
      icon: GraduationCap,
      title: "Immigration status",
      body: "A German residence permit or Niederlassungserlaubnis usually lapses after 6 months abroad. If you may return, apply for a re-entry permit (Wiederkehrerlaubnis) or a longer permit before leaving.",
      items: [
        "Blue Card holders: 12-month absence tolerated; longer needs a re-entry permit",
        "Naturalisation candidates: an Abmeldung resets residence time — coordinate with your Einbürgerungssachbearbeiter first",
        "Non-EU citizens: hand back or invalidate residence card at Ausländerbehörde — do NOT keep it in a drawer",
        "Return of Kindergeld / Elterngeld after leaving is common — set up direct debits to catch clawbacks",
      ],
    },
    {
      icon: Briefcase,
      title: "Employer, unemployment & references",
      body: "Get a qualified Arbeitszeugnis before you leave — you cannot easily request one from abroad. If you may claim unemployment in Germany or export it to the EU, coordinate with the Agentur für Arbeit before Abmeldung.",
      items: [
        "PD U1 exports your German insurance record so the new country counts it toward benefits",
        "PD U2 exports an existing ALG entitlement for up to 6 months while you job-hunt abroad",
        "Ensure the employer settles Resturlaub, Überstunden, and 13. Monatsgehalt into the final payslip",
        "For freelancers: notify Finanzamt about the closure of self-employment (Gewerbeabmeldung / Freiberufler-Abschluss)",
      ],
    },
    {
      icon: Package,
      title: "Move logistics, car & pets",
      body: "International removals need lead time. Get 3 quotes, insured door-to-door, with a written packing list — customs on both sides may inspect. Cars can be exported with red export plates (Kurzzeitkennzeichen) or sold before leaving; pets need an EU pet passport, microchip, and, for many countries, a rabies titre 3+ months in advance.",
      items: [
        "Book the shipper 6–8 weeks out; provide the Abmeldung date on the customs form",
        "Kfz-Abmeldung at Zulassungsstelle before selling or exporting; keep the Verwertungsnachweis",
        "For pets to the UK, USA, Australia, NZ, or GCC: start rabies-titre and quarantine steps 3–6 months before flying",
        "Sort a temporary storage container in Germany if there's a gap — insurance is cheap and worth it",
      ],
    },
    {
      icon: Mail,
      title: "Consulate & legal continuity",
      body: "Once abroad, register at the German consulate if you want to vote in German elections; if the new country requires it, register with its embassy as a resident. Keep copies of every Abmeldung, tax return, and pension statement — you will be asked for them 5 and 10 years later.",
      items: [
        "Deutsche im Ausland registration (Krisenvorsorgeliste, ELEFAND) helps if there's a crisis in the new country",
        "Set up a scanned-document vault (we provide one) — losing paperwork abroad is expensive",
        "Powers of attorney: appoint a trusted person in Germany to handle late letters, tax audits, or Kaution disputes",
        "If you own an S1 / A1 / PD U2 form, keep original stamped copies — new-country institutions may refuse a scan",
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          Every area covered
        </div>
        <h2 className="display-lg text-balance mt-3 font-semibold">
          What actually needs to be done.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Ten areas, ordered by the pain they cause when neglected. Each one is a service
          in our Wegzug package — pick the whole package or just the parts you cannot
          handle yourself.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
            </div>
            <p className="mt-3 text-sm text-foreground/80">{s.body}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
              {s.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Warnings() {
  const rows: { title: string; body: string }[] = [
    {
      title: "Wegzugsteuer ambush",
      body: "Holding >1% in a Kapitalgesellschaft (also foreign ones held in a German portfolio) triggers a deemed-sale tax the day you leave the EU/EEA. Screen for this at least 60 days before Abmeldung — restructuring options disappear once you file.",
    },
    {
      title: "Health-cover gap on return",
      body: "If you return to Germany within 5 years, statutory health insurance can force you back — but only if you kept an Auslandsanwartschaft. Losing it means a private policy from day 1 back, often 3–5× the price.",
    },
    {
      title: "Kaution disappeared",
      body: "Landlords are legally allowed 3–6 months to release the deposit against Nebenkostenabrechnung. Give a working forwarding address in writing, agree the release schedule, and appoint a proxy — pursuing it from abroad is the #1 unhappy scenario.",
    },
    {
      title: "Residence permit lapses",
      body: "Even a Niederlassungserlaubnis usually lapses after 6 months abroad. A Wiederkehrerlaubnis before leaving keeps the door open for up to 24 months. Naturalisation-in-progress applicants: talk to the caseworker before Abmeldung.",
    },
    {
      title: "Kindergeld / Elterngeld clawback",
      body: "Failing to notify Familienkasse promptly means overpayments — recovered later with interest. Notify the month before Abmeldung, keep the confirmation.",
    },
    {
      title: "Pension refund missed",
      body: "Non-EU citizens who paid ≥60 months of Rentenversicherung and are not planning to return can apply for a Beitragsrückerstattung after 24 months abroad. Many people never claim it — worth thousands of euros.",
    },
  ];
  return (
    <section className="bg-parchment/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Traps we protect against
          </div>
          <h2 className="display-lg text-balance mt-3 font-semibold text-ink">
            The mistakes that cost money after you land.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl border border-destructive/25 bg-card p-5 shadow-soft"
            >
              <div className="font-display text-base font-semibold text-ink">
                {r.title}
              </div>
              <p className="mt-2 text-sm text-foreground/80">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-teal/10 p-8 shadow-elevated sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PlaneTakeoff className="h-6 w-6" />
        </div>
        <h2 className="display-md mt-4 font-semibold">
          Book a Wegzug case manager.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          One flat fee, one case manager, all authorities. We start with a 30-minute call
          to map your specific situation (tax residency, visa, family, property) and hand
          you a personalised checklist in your language.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-primary">
            <Link to="/contact">
              Start my leaving plan <ArrowRight className="ml-2 h-4 w-4 rtl-flip" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/pricing">See plans & pricing</Link>
          </Button>
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" /> StBerG-compliant partners
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Berlin · NRW · nationwide by call
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Full audit trail in your case file
          </span>
        </p>
      </div>
    </section>
  );
}
