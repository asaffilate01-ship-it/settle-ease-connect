import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { publicLegal } from "@/lib/public-config";

export const Route = createFileRoute("/legal/complaints")({
  head: () => ({
    meta: [
      { title: "Beschwerdeverfahren — BeistandPlus" },
      {
        name: "description",
        content: "Beschwerden nach deutschem Verbraucherrecht (VSBG, BGB, DSGVO).",
      },
      { property: "og:title", content: "Beschwerdeverfahren — BeistandPlus" },
      { property: "og:url", content: "/legal/complaints" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/legal/complaints" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Beschwerdeverfahren" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="1. Zuerst der Fallmanager">
        <p>
          Am schnellsten lassen sich Anliegen direkt mit Ihrer Fallmanagerin oder Ihrem Fallmanager
          im Fall-Arbeitsbereich klären. Bitte nennen Sie Ihre Fallnummer und eine kurze
          Beschreibung.
        </p>
      </LegalSection>

      <LegalSection title="2. Förmliche Beschwerde">
        <p>
          Für eine förmliche Beschwerde schreiben Sie an{" "}
          <a href={`mailto:${publicLegal.legalEmail}`}>{publicLegal.legalEmail}</a>. Bitte geben Sie
          an:
        </p>
        <ul>
          <li>Vollständiger Name und Konto-E-Mail-Adresse</li>
          <li>Fallnummer (sofern vorhanden)</li>
          <li>Kurze Sachverhaltsschilderung mit Datumsangaben</li>
          <li>Gewünschtes Ergebnis</li>
        </ul>
        <p>
          Wir bestätigen den Eingang und teilen Ihnen den zuständigen Kontakt sowie die
          voraussichtliche Bearbeitungszeit mit. Eine feste Reaktionsfrist gilt nur, wenn sie im
          veröffentlichten Supportprozess oder zwingend gesetzlich vorgesehen ist.
        </p>
      </LegalSection>

      <LegalSection title="3. Verbraucherstreitbeilegung (§ 36 VSBG)">
        <p>
          Wir sind gemäß § 36 Abs. 1 Nr. 2 VSBG <strong>nicht verpflichtet und nicht bereit</strong>
          , an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          Die frühere Online-Streitbeilegungsplattform der EU wurde eingestellt und wird daher nicht
          als Beschwerdeweg angegeben.
        </p>
      </LegalSection>

      <LegalSection title="4. Datenschutz-Beschwerden">
        <p>
          Beschwerden über die Verarbeitung personenbezogener Daten richten Sie an{" "}
          <a href={`mailto:${publicLegal.privacyEmail}`}>{publicLegal.privacyEmail}</a>. Ihnen steht
          zudem gemäß Art. 77 DSGVO ein Beschwerderecht bei einer zuständigen
          Datenschutzaufsichtsbehörde zu. Die konkret zuständige Behörde ist anhand des finalen
          Unternehmenssitzes zu bestätigen.
        </p>
      </LegalSection>

      <LegalSection title="5. Rechtsweg">
        <p>
          Unabhängig vom Beschwerdeverfahren bleibt Ihnen der ordentliche Rechtsweg vor den
          deutschen Zivilgerichten unbenommen. Zwingende Verbraucherschutzrechte am Wohnsitz bleiben
          unberührt (Art. 6 Rom-I-VO).
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
