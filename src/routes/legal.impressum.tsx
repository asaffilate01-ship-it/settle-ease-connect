import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

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
    <LegalArticle title="Impressum" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)">
        <p>
          BeistandPlus GmbH<br />
          Musterstraße 1<br />
          10115 Berlin<br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Vertreten durch">
        <p>Geschäftsführung: (wird ergänzt)</p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: (wird ergänzt)<br />
          E-Mail: <a href="mailto:hello@beistand.de">hello@beistand.de</a>
        </p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: Amtsgericht Berlin-Charlottenburg<br />
          Registernummer: HRB (wird ergänzt)
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-ID">
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE (wird ergänzt)</p>
      </LegalSection>

      <LegalSection title="Redaktionell verantwortlich nach § 18 Abs. 2 MStV">
        <p>(wird ergänzt), Musterstraße 1, 10115 Berlin</p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung / EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
          bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer noopener">https://ec.europa.eu/consumers/odr</a>.
          Wir sind gemäß § 36 VSBG nicht verpflichtet und nicht bereit, an einem
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
