import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "AGB — BeistandPlus" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen und Widerrufsbelehrung nach deutschem Recht (BGB, DDG)." },
      { property: "og:title", content: "AGB — BeistandPlus" },
      { property: "og:url", content: "/legal/terms" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/legal/terms" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Allgemeine Geschäftsbedingungen" updated="2026-04-01">
      <BilingualNote />

      <LegalSection title="1. Anbieter">
        <p>
          Anbieter im Sinne des § 5 DDG ist die BeistandPlus GmbH, Musterstraße 1, 10115 Berlin
          (im Folgenden „BeistandPlus", „wir"). Vollständige Angaben siehe {" "}
          <a href="/legal/impressum">Impressum</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Geltungsbereich, Vertragssprache">
        <p>
          Diese AGB gelten für alle Verträge zwischen BeistandPlus und Ihnen über die Nutzung der
          BeistandPlus-Plattform. Vertragssprachen sind Deutsch und Englisch; maßgeblich ist im
          Zweifel die deutsche Fassung. Abweichende Bedingungen erkennen wir nicht an,
          soweit ihnen nicht ausdrücklich zugestimmt wurde.
        </p>
      </LegalSection>

      <LegalSection title="3. Leistungen">
        <p>
          BeistandPlus ist eine Ansiedlungs- und Fürsorgeplattform für in Deutschland lebende oder
          zuziehende Menschen. Wir bieten Fallmanagement, Checklisten, ein Familien-Dokumenten-
          Depot, einen KI-Assistenten sowie die Vermittlung geprüfter Experten (Anwälte, Notare,
          Steuerberater, Ärzte, Bestatter, Übersetzer). BeistandPlus ist selbst <strong>keine</strong>
          Kanzlei, Steuerkanzlei, Versicherungsvermittlung, Arztpraxis oder Bestattungsunternehmen.
          Beratungsverträge kommen ausschließlich zwischen Ihnen und dem jeweiligen Experten
          zustande.
        </p>
      </LegalSection>

      <LegalSection title="4. Vertragsschluss">
        <p>
          Mit dem Absenden der Registrierung geben Sie ein Angebot zum Abschluss eines
          Nutzungsvertrags ab. Der Vertrag kommt mit unserer Bestätigung per E-Mail zustande.
          Sie sind mindestens 18 Jahre alt und handeln entweder als Verbraucher (§ 13 BGB)
          oder als Unternehmer (§ 14 BGB).
        </p>
      </LegalSection>

      <LegalSection title="5. Preise, Zahlung, Verbraucher-Abo-Rechte (§ 312k BGB)">
        <p>
          Die Abos betragen 5 €, 10 € oder 25 € pro Monat pro Haushalt (inkl. gesetzlicher USt).
          Kosten für Behörden, Experten, Versicherungen etc. werden gesondert transparent
          ausgewiesen. Die Abrechnung erfolgt monatlich im Voraus über unseren
          Zahlungsdienstleister. Bei Verträgen mit Verbrauchern über Dauerschuldverhältnisse
          gilt § 312k BGB: Kündigung jederzeit über die im Konto bereitgestellte
          Kündigungs-Schaltfläche zum Ende des laufenden Abrechnungszeitraums.
        </p>
      </LegalSection>

      <LegalSection title="6. Widerrufsbelehrung für Verbraucher (§§ 355, 312g BGB)">
        <p>
          <strong>Widerrufsrecht.</strong> Sie haben das Recht, binnen vierzehn Tagen ohne
          Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn
          Tage ab dem Tag des Vertragsschlusses. Um Ihr Widerrufsrecht auszuüben, müssen Sie
          uns (BeistandPlus GmbH, Musterstraße 1, 10115 Berlin, E-Mail
          {" "}<a href="mailto:widerruf@beistand.de">widerruf@beistand.de</a>) mittels einer
          eindeutigen Erklärung (z. B. per Brief oder E-Mail) über Ihren Entschluss, diesen
          Vertrag zu widerrufen, informieren. Zur Wahrung der Widerrufsfrist reicht es aus,
          dass Sie die Mitteilung vor Ablauf der Widerrufsfrist absenden.
        </p>
        <p>
          <strong>Folgen des Widerrufs.</strong> Wenn Sie diesen Vertrag widerrufen, erstatten
          wir Ihnen alle Zahlungen unverzüglich und spätestens binnen vierzehn Tagen zurück.
          Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll,
          so haben Sie uns einen angemessenen Betrag für die bis zum Widerruf bereits erbrachte
          Leistung zu zahlen.
        </p>
        <p>
          <strong>Vorzeitiges Erlöschen.</strong> Das Widerrufsrecht erlischt bei einem Vertrag
          zur Erbringung von Dienstleistungen, wenn wir die Dienstleistung vollständig erbracht
          haben und mit der Ausführung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche
          Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie
          Ihr Widerrufsrecht bei vollständiger Vertragserfüllung verlieren (§ 356 Abs. 4 BGB).
        </p>
      </LegalSection>

      <LegalSection title="7. Pflichten der Nutzenden">
        <p>
          Zugangsdaten sind vertraulich zu halten. Sie versichern, keine rechtswidrigen Inhalte
          hochzuladen, Behörden nicht zu täuschen und Rechte Dritter zu wahren. Verstöße
          berechtigen uns zur Sperrung.
        </p>
      </LegalSection>

      <LegalSection title="8. Haftung">
        <p>
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach dem
          Produkthaftungsgesetz und für Schäden aus der Verletzung des Lebens, des Körpers
          oder der Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten
          (Kardinalpflichten) ist unsere Haftung auf den vertragstypischen, vorhersehbaren
          Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen.
        </p>
      </LegalSection>

      <LegalSection title="9. Gewährleistung">
        <p>
          Es gelten die gesetzlichen Vorschriften der §§ 327 ff. BGB (Verträge über digitale
          Produkte) einschließlich der Regelungen zur Aktualisierungspflicht.
        </p>
      </LegalSection>

      <LegalSection title="10. Streitbeilegung, Rechtswahl, Gerichtsstand">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht der Schutz
          zwingender Verbrauchervorschriften des Aufenthaltsstaats entzogen wird (Art. 6 Rom-I-VO).
          Gerichtsstand für Kaufleute ist Berlin. Zur außergerichtlichen Streitbeilegung siehe
          {" "}<a href="/legal/complaints">Beschwerdeverfahren</a>. Wir sind gemäß § 36 VSBG
          nicht verpflichtet und nicht bereit, an Verbraucherschlichtungsverfahren teilzunehmen.
        </p>
      </LegalSection>

      <LegalSection title="11. Änderungen dieser AGB">
        <p>
          Wesentliche Änderungen kündigen wir mindestens 30 Tage vorab per E-Mail und
          In-App-Hinweis an. Widersprechen Sie nicht binnen dieser Frist, gelten die
          Änderungen als angenommen; wir weisen Sie hierauf gesondert hin.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
