import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { company, missingLegalIdentityFields } from "@/config/company";

export const Route = createFileRoute("/legal/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — BeistandPlus" },
      { name: "description", content: "Anbieterkennzeichnung nach § 5 DDG und § 18 Abs. 2 MStV." },
      { property: "og:title", content: "Impressum — BeistandPlus" },
      { property: "og:url", content: "/legal/impressum" },
    ],
    links: [{ rel: "canonical", href: "/legal/impressum" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Impressum" updated="2026-08-01">
      <BilingualNote />

      {missingLegalIdentityFields.length > 0 && (
        <div role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <strong>Pre-launch configuration required.</strong> This service must not be publicly
          launched until the following operator details are supplied and legally reviewed:{" "}
          {missingLegalIdentityFields.join(", ")}.
        </div>
      )}

      <LegalSection title="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)">
        <p>
          {company.legalName || "Not configured"}<br />
          {company.streetAddress || "Not configured"}<br />
          {company.postalCity || "Not configured"}<br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Vertreten durch">
        <p>Geschäftsführung: {company.managingDirector || "Not configured"}</p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          {company.supportPhone && <>Telefon: {company.supportPhone}<br /></>}
          E-Mail: <a href={`mailto:${company.legalEmail}`}>{company.legalEmail}</a>
        </p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: {company.registerCourt || "Not configured"}<br />
          Registernummer: {company.registerNumber || "Not configured"}
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-ID">
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {company.vatId || "Not configured, if applicable"}</p>
      </LegalSection>

      <LegalSection title="Redaktionell verantwortlich nach § 18 Abs. 2 MStV">
        <p>{company.editorialResponsible || "Not configured"}, {company.streetAddress || "address not configured"}, {company.postalCity || "postal address not configured"}</p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung">
        <p>
          Die frühere EU-Plattform zur Online-Streitbeilegung wurde am 20. Juli 2025
          eingestellt. Wir sind gemäß § 36 VSBG nicht verpflichtet und nicht bereit, an einem
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte und Links">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir jedoch
          nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
          Bei Bekanntwerden von Rechtsverletzungen entfernen wir diese Inhalte umgehend.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
