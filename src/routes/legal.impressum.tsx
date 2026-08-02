import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { publicLegal } from "@/lib/public-config";

export const Route = createFileRoute("/legal/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — BeistandPlus" },
      { name: "description", content: "Anbieterkennzeichnung nach § 5 DDG und § 18 Abs. 2 MStV." },
      { property: "og:title", content: "Impressum — BeistandPlus" },
      { property: "og:url", content: "/legal/impressum" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/legal/impressum" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Impressum" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)">
        <p>
          {publicLegal.name}
          <br />
          {publicLegal.street}
          <br />
          {publicLegal.postalCity}
          <br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Vertreten durch">
        <p>Geschäftsführung: {publicLegal.managingDirector}</p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: {publicLegal.supportPhone}
          <br />
          E-Mail: <a href={`mailto:${publicLegal.legalEmail}`}>{publicLegal.legalEmail}</a>
        </p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <p>
          Eintragung im Handelsregister.
          <br />
          Registergericht: {publicLegal.registerCourt}
          <br />
          Registernummer: {publicLegal.registerNumber}
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-ID">
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {publicLegal.vatId}</p>
      </LegalSection>

      <LegalSection title="Redaktionell verantwortlich nach § 18 Abs. 2 MStV">
        <p>
          {publicLegal.editorialResponsible}, {publicLegal.street}, {publicLegal.postalCity}
        </p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung">
        <p>
          Wir sind gemäß § 36 VSBG nicht verpflichtet und nicht bereit, an einem
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Die
          frühere Online-Streitbeilegungsplattform der EU wurde eingestellt.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte und Links">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen. Bei
          Bekanntwerden von Rechtsverletzungen entfernen wir diese Inhalte umgehend.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
