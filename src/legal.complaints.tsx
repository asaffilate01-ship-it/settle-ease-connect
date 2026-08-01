import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/complaints")({
  head: () => ({
    meta: [
      { title: "Beschwerdeverfahren — BeistandPlus" },
      { name: "description", content: "Beschwerden nach deutschem Verbraucherrecht (VSBG, BGB, DSGVO)." },
      { property: "og:title", content: "Beschwerdeverfahren — BeistandPlus" },
      { property: "og:url", content: "/legal/complaints" },
    ],
    links: [{ rel: "canonical", href: "/legal/complaints" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Beschwerdeverfahren" updated="2026-08-01">
      <BilingualNote />

      <LegalSection title="1. Zuerst der Fallmanager">
        <p>
          Am schnellsten lassen sich Anliegen direkt mit Ihrer Fallmanagerin oder Ihrem
          Fallmanager im Fall-Arbeitsbereich klären. Bitte nennen Sie Ihre Fallnummer und
          eine kurze Beschreibung.
        </p>
      </LegalSection>

      <LegalSection title="2. Förmliche Beschwerde">
        <p>
          Für eine förmliche Beschwerde schreiben Sie an
          {" "}<a href="mailto:complaints@beistandplus.de">complaints@beistandplus.de</a>. Bitte geben Sie an:
        </p>
        <ul>
          <li>Vollständiger Name und Konto-E-Mail-Adresse</li>
          <li>Fallnummer (sofern vorhanden)</li>
          <li>Kurze Sachverhaltsschilderung mit Datumsangaben</li>
          <li>Gewünschtes Ergebnis</li>
        </ul>
        <p>
          Wir bestätigen jede Beschwerde innerhalb von <strong>2 Werktagen</strong> und
          antworten inhaltlich innerhalb von <strong>15 Werktagen</strong>. Dauert die Prüfung
          länger, informieren wir Sie unter Nennung eines neuen Termins.
        </p>
      </LegalSection>

      <LegalSection title="3. Verbraucherstreitbeilegung (§ 36 VSBG)">
        <p>
          Wir sind gemäß § 36 Abs. 1 Nr. 2 VSBG <strong>nicht verpflichtet und nicht bereit</strong>,
          an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          Verbraucherinnen und Verbraucher können sich gleichwohl an die Universalschlichtungsstelle
          des Bundes in Kehl wenden. Die frühere Online-Streitbeilegungs-Plattform der EU wurde
          am 20. Juli 2025 eingestellt.
        </p>
      </LegalSection>

      <LegalSection title="4. Datenschutz-Beschwerden">
        <p>
          Beschwerden über die Verarbeitung personenbezogener Daten richten Sie an
          {" "}<a href="mailto:privacy@beistandplus.de">privacy@beistandplus.de</a>. Ihnen steht zudem
          gemäß Art. 77 DSGVO ein Beschwerderecht bei einer Aufsichtsbehörde zu — für uns
          zuständig ist die <strong>Berliner Beauftragte für Datenschutz und Informationsfreiheit</strong>,
          Alt-Moabit 59–61, 10555 Berlin.
        </p>
      </LegalSection>

      <LegalSection title="5. Rechtsweg">
        <p>
          Unabhängig vom Beschwerdeverfahren bleibt Ihnen der ordentliche Rechtsweg vor den
          deutschen Zivilgerichten unbenommen. Zwingende Verbraucherschutzrechte am Wohnsitz
          bleiben unberührt (Art. 6 Rom-I-VO).
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
