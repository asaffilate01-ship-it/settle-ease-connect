import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/partners/insurers")({
  head: () => ({
    meta: [
      { title: "Insurance Partnership — BeistandPlus" },
      { name: "description", content: "Partnership one-pager for German Sterbegeld insurers: distribution model, target segment, integration, commercials." },
      { property: "og:title", content: "Insurance Partnership — BeistandPlus" },
      { property: "og:description", content: "Distribute bereavement cover to Germany's migrant families through a licensed, multilingual case-managed super-app." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnersInsurers,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PartnersInsurers() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="uppercase tracking-wider">Partnership brief</Badge>
        <h1 className="display-hero mt-4 font-semibold">
          Distribute Sterbegeld to Germany's migrant families.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          BeistandPlus is a multilingual settlement super-app for Germany's 15M migrant residents. We
          case-manage every claim end-to-end, pay funeral directors directly, and handle family
          communication in 12 languages. We're looking for one launch partner per benefit tier.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">Target segment</h2>
            <div className="mt-4 space-y-0">
              <Row label="Primary" value="TR · UR · HI · PA · AR · KU · RU · FA · PL speakers in DE" />
              <Row label="Household income" value="€28k–€65k" />
              <Row label="Age band" value="28–65 (bereavement cover)" />
              <Row label="Current penetration" value="< 8% (Sterbegeld market)" />
              <Row label="Repatriation-need share" value="~46% of Muslim & Sikh households" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">Distribution model</h2>
            <div className="mt-4 space-y-0">
              <Row label="Legal basis" value="§34d GewO broker (Beistand) or Tippgeber" />
              <Row label="Onboarding" value="In-app quote widget → case manager → binding offer" />
              <Row label="Underwriting" value="Simplified or full — insurer's choice" />
              <Row label="Payment flow" value="Direct debit collected by insurer" />
              <Row label="Retention" value="Yearly touchpoint via case manager" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">Integration</h2>
            <div className="mt-4 space-y-0">
              <Row label="Lead API" value="REST/JSON or CSV feed (daily)" />
              <Row label="Policy webhook" value="POST /api/public/insurers/{slug}/status" />
              <Row label="Doc exchange" value="SFTP or S3 signed URLs" />
              <Row label="Claim handoff" value="Case manager + shared claim workspace" />
              <Row label="Compliance" value="DSGVO, BDSG, §25 TDDDG, §34d GewO" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">Commercials</h2>
            <div className="mt-4 space-y-0">
              <Row label="Model" value="Abschluss + Bestand (broker) or flat referral (Tippgeber)" />
              <Row label="Abschluss target" value="40–60% of Year-1 premium" />
              <Row label="Bestand target" value="3–6% recurring" />
              <Row label="Volume commitment Y1" value="~1,200 policies" />
              <Row label="Exclusivity" value="Non-exclusive; one launch partner per tier" />
            </div>
          </Card>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Why this works</h2>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            <li>• <strong className="text-foreground">Trusted distribution.</strong> Families come to BeistandPlus for Anmeldung, Kindergeld and residence permits. Bereavement cover is a natural cross-sell at high-trust moments.</li>
            <li>• <strong className="text-foreground">Lower loss ratio.</strong> Direct-to-funeral-director payment eliminates the retail markup that inflates traditional claims.</li>
            <li>• <strong className="text-foreground">Native-language claim handling.</strong> Cuts your call-centre load and complaint rate for a segment most insurers underserve.</li>
            <li>• <strong className="text-foreground">Regulated conduit.</strong> BeistandPlus is (or will be) §34d GewO registered with liability cover in place — clean broker relationship, no compliance retrofit.</li>
          </ul>
        </div>

        <div className="mt-16 rounded-xl border bg-accent/30 p-8">
          <h2 className="font-display text-2xl font-semibold">Next step</h2>
          <p className="mt-2 text-muted-foreground">
            A 30-minute call with your broker-channel team. We'll share the product spec, expected
            volume by state, and mock claim workflow.
          </p>
          <div className="mt-4 text-sm">
            <div><strong>Contact:</strong> partnerships@beistand.de</div>
            <div className="mt-1"><strong>Location:</strong> Berlin</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
