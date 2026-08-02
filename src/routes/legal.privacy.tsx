import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { legalAddressInline, publicLegal } from "@/lib/public-config";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Datenschutz (DSGVO / BDSG) — BeistandPlus" },
      { name: "description", content: "Datenschutzerklärung nach DSGVO und BDSG." },
      { property: "og:title", content: "Datenschutz (DSGVO / BDSG) — BeistandPlus" },
      { property: "og:url", content: "/legal/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/legal/privacy" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Datenschutzerklärung (DSGVO / BDSG)" updated="2026-08-02">
      <BilingualNote />

      <LegalSection title="1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)">
        <p>
          {legalAddressInline()}. E-Mail:{" "}
          <a href={`mailto:${publicLegal.privacyEmail}`}>{publicLegal.privacyEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Datenschutzbeauftragter">
        <p>
          Sie erreichen unseren Datenschutzbeauftragten unter{" "}
          <a href={`mailto:${publicLegal.dpoEmail}`}>{publicLegal.dpoEmail}</a> oder postalisch
          unter obiger Anschrift mit dem Zusatz „Datenschutzbeauftragter".
        </p>
      </LegalSection>

      <LegalSection title="3. Verarbeitete Daten">
        <ul>
          <li>Bestandsdaten: Name, E-Mail, Telefon, Sprache.</li>
          <li>Falldaten: Dokumente, Korrespondenz, Terminnotizen.</li>
          <li>Depot-Daten: sensible Dokumente und zugehörige Metadaten.</li>
          <li>Zahlungsdaten: Abrechnungs- und Transaktionsdaten des Zahlungsdienstleisters.</li>
          <li>
            KI-Daten (optional): die von Ihnen ausgewählten Fragen oder Dokumenttexte sowie die
            erzeugten Ergebnisse.
          </li>
          <li>Nutzungsdaten: nur bei entsprechender Einwilligung (§ 25 TDDDG).</li>
          <li>
            Besondere Kategorien (Art. 9 DSGVO, z. B. Gesundheit, Religion): nur auf Basis Ihrer
            ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Zwecke und Rechtsgrundlagen">
        <ul>
          <li>
            <strong>Vertragsdurchführung</strong> — Art. 6 Abs. 1 lit. b DSGVO (Konto, Fälle,
            Zahlungen).
          </li>
          <li>
            <strong>Rechtliche Verpflichtungen</strong> — Art. 6 Abs. 1 lit. c DSGVO iVm §§ 147 AO,
            257 HGB, GwG.
          </li>
          <li>
            <strong>Berechtigte Interessen</strong> — Art. 6 Abs. 1 lit. f DSGVO (Sicherheit,
            Betrugsprävention).
          </li>
          <li>
            <strong>Einwilligung</strong> — Art. 6 Abs. 1 lit. a bzw. Art. 9 Abs. 2 lit. a DSGVO; §
            25 TDDDG bei Cookies.
          </li>
          <li>
            <strong>Beschäftigtendaten</strong> — § 26 BDSG.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Empfänger / Auftragsverarbeiter">
        <p>
          Wir geben Daten nur an vertraglich gebundene Auftragsverarbeiter (Art. 28 DSGVO) weiter:
          Hosting- und Datenbankdienste, Zahlungs- und E-Mail-Dienste, den Sicherheitsdienst für
          Dateiprüfungen und — bei ausdrücklicher Aktivierung — den KI-Dienst. Falldaten werden nur
          auf Ihre Weisung oder einer anderen gültigen Rechtsgrundlage an den für den Fall
          ausgewählten Experten übermittelt. Angaben zu eingesetzten Anbietern, Verarbeitungsorten
          und Übermittlungsmechanismen erhalten Sie über die Datenschutzkontaktadresse. Eine
          Drittlandübermittlung erfolgt nur, wenn die gesetzlichen Voraussetzungen und geeignete
          Garantien erfüllt sind.
        </p>
      </LegalSection>

      <LegalSection title="6. Speicherdauer">
        <p>
          Wir speichern Daten nur so lange, wie dies für den jeweiligen Zweck erforderlich ist.
          Anschließend werden sie gelöscht oder gesperrt, sofern keine gesetzliche
          Aufbewahrungspflicht, kein offener Anspruch und keine dokumentierte rechtliche Sperre
          entgegensteht. Die Frist richtet sich insbesondere nach Datenart, Vertragsdauer,
          gesetzlichen Aufbewahrungspflichten und Verjährungsfristen. Depot-Dateien werden bei
          Kontoschließung oder auf bestätigte Anforderung gelöscht, soweit keine Sperre greift.
          KI-Eingaben werden von BeistandPlus nicht als Promptprotokoll gespeichert; erzeugte
          KI-Ergebnisse werden nach 30 Tagen zur Löschung eingeplant.
        </p>
      </LegalSection>

      <LegalSection title="7. Ihre Rechte">
        <ul>
          <li>Auskunft (Art. 15 DSGVO)</li>
          <li>Berichtigung (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Einschränkung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch (Art. 21 DSGVO)</li>
          <li>
            Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)
          </li>
          <li>
            Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO). Die für private
            Unternehmen zuständige Landesbehörde richtet sich nach dem Sitz des Verantwortlichen.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Automatisierte Entscheidungen">
        <p>
          Es findet keine ausschließlich automatisierte Entscheidungsfindung mit rechtlicher Wirkung
          im Sinne des Art. 22 DSGVO statt. KI-Funktionen sind optional, zweckgebunden und müssen
          aktiviert werden. Ihre Ausgaben sind Entwürfe und werden nicht automatisch in
          Fallentscheidungen, Leistungszusagen oder Behördenhandlungen übernommen.
        </p>
      </LegalSection>

      <LegalSection title="9. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)">
        <p>
          Transportverschlüsselung, Zugriffskontrollen nach Rolle und Sicherheitsniveau,
          Mehrfaktorprüfung für sensible Bereiche, Protokollierung privilegierter Vorgänge, private
          Dateiablage, Sicherheitsprüfung hochgeladener Dateien sowie gesicherte Datensicherungs-
          und Wiederherstellungsverfahren. Die Maßnahmen werden anhand des Risikos und des
          eingesetzten Hostings regelmäßig überprüft.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
