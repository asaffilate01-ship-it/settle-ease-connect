import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — Beistand" },
      { name: "description", content: "Legal imprint / provider identification for Beistand under § 5 TMG." },
      { property: "og:title", content: "Impressum — Beistand" },
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

      <LegalSection title="Angaben gemäß § 5 TMG">
        <p>
          Beistand GmbH<br />
          Musterstraße 1<br />
          10115 Berlin<br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Vertreten durch">
        <p>Geschäftsführung: (to be confirmed)</p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: (to be confirmed)<br />
          E-Mail: <a href="mailto:hello@beistand.de">hello@beistand.de</a>
        </p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: Amtsgericht Berlin-Charlottenburg<br />
          Registernummer: (to be confirmed)
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-ID">
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: (to be confirmed)
        </p>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
        <p>(to be confirmed), Musterstraße 1, 10115 Berlin</p>
      </LegalSection>

      <LegalSection title="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          {" "}<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer noopener">https://ec.europa.eu/consumers/odr</a>. Unsere E-Mail-Adresse finden Sie oben.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
