import { createFileRoute } from "@tanstack/react-router";
import { LegalArticle, LegalSection, BilingualNote } from "@/components/legal-article";
import { company, legalOperatorLabel } from "@/config/company";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Datenschutz (DSGVO / BDSG) — BeistandPlus" },
      { name: "description", content: "Datenschutzerklärung nach DSGVO und BDSG." },
      { property: "og:title", content: "Datenschutz (DSGVO / BDSG) — BeistandPlus" },
      { property: "og:url", content: "/legal/privacy" },
    ],
    links: [{ rel: "canonical", href: "/legal/privacy" }],
  }),
  component: Page,
});

function Page() {
  return (
    <LegalArticle title="Datenschutzerklärung (DSGVO / BDSG)" updated="2026-08-01">
      <BilingualNote />

      <LegalSection title="1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)">
        <p>
          {legalOperatorLabel()}, {company.streetAddress || "Anschrift laut Impressum"}, {company.postalCity}, Deutschland.
          E-Mail: <a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Datenschutzbeauftragter">
        <p>
          {company.dpoEmail ? (
            <>Sie erreichen den benannten Datenschutzbeauftragten unter {" "}<a href={`mailto:${company.dpoEmail}`}>{company.dpoEmail}</a>.</>
          ) : (
            <>Datenschutzanfragen richten Sie bitte an {" "}<a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a>. Ein Datenschutzbeauftragter wird nur benannt, soweit dies gesetzlich erforderlich ist.</>
          )}
        </p>
      </LegalSection>

      <LegalSection title="3. Verarbeitete Daten">
        <ul>
          <li>Bestandsdaten: Name, E-Mail, Telefon, Sprache.</li>
          <li>Falldaten: Dokumente, Korrespondenz, Terminnotizen.</li>
          <li>Depot-Daten: sensible Dokumente, verschlüsselt gespeichert.</li>
          <li>Zahlungsdaten: über PCI-DSS-konformen Zahlungsdienstleister.</li>
          <li>Nutzungsdaten: nur bei entsprechender Einwilligung (§ 25 TDDDG).</li>
          <li>Besondere Kategorien (Art. 9 DSGVO, z. B. Gesundheit, Religion): nur auf Basis Ihrer ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a DSGVO.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Zwecke und Rechtsgrundlagen">
        <ul>
          <li><strong>Vertragsdurchführung</strong> — Art. 6 Abs. 1 lit. b DSGVO (Konto, Fälle, Zahlungen).</li>
          <li><strong>Rechtliche Verpflichtungen</strong> — Art. 6 Abs. 1 lit. c DSGVO iVm §§ 147 AO, 257 HGB, GwG.</li>
          <li><strong>Berechtigte Interessen</strong> — Art. 6 Abs. 1 lit. f DSGVO (Sicherheit, Betrugsprävention).</li>
          <li><strong>Einwilligung</strong> — Art. 6 Abs. 1 lit. a bzw. Art. 9 Abs. 2 lit. a DSGVO; § 25 TDDDG bei Cookies.</li>
          <li><strong>Beschäftigtendaten</strong> — § 26 BDSG.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Empfänger / Auftragsverarbeiter">
        <p>
          Wir geben Daten nur an vertraglich gebundene Auftragsverarbeiter (Art. 28 DSGVO)
          weiter: EU-Cloud-Hoster, Zahlungsdienstleister, E-Mail-Provider und — nur auf Ihre
          Weisung — an die geprüften Experten in Ihrem Fall. Eine Übermittlung in Drittländer
          findet grundsätzlich nicht statt; ausnahmsweise nur unter EU-Standardvertragsklauseln
          (Art. 46 Abs. 2 lit. c DSGVO) und mit ergänzenden Schutzmaßnahmen nach EDSA-Leitlinien.
        </p>
        <p>
          Für KI-gestützte Übersetzung und Hilfestellung können Texte an den konfigurierten
          KI-Gateway- und Modellanbieter übermittelt werden. In der aktuellen technischen
          Konfiguration sind dies der Lovable AI Gateway und Google Gemini. Besondere Kategorien
          personenbezogener Daten dürfen nur nach einer dokumentierten Rechtsgrundlage bzw.
          ausdrücklichen Einwilligung verarbeitet werden. Etwaige Drittlandübermittlungen werden
          vor dem Produktivstart in der Auftragsverarbeiterliste einschließlich Garantien nach
          Kapitel V DSGVO dokumentiert.
        </p>
      </LegalSection>

      <LegalSection title="6. Speicherdauer">
        <p>
          Konto- und Falldaten: für die Dauer des Vertrags plus bis zu 3 Jahre (Verjährung
          nach § 195 BGB) bzw. bis zu 10 Jahre bei Rechnungen (§ 147 AO). Depot-Daten:
          Löschung auf Anforderung oder bei Kontoschließung. Statistikdaten: 14 Monate.
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
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
          <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO) — für uns zuständig: Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Automatisierte Entscheidungen">
        <p>
          Es findet keine ausschließlich automatisierte Entscheidungsfindung mit rechtlicher
          Wirkung im Sinne des Art. 22 DSGVO statt. KI-gestützte Vorschläge werden stets von
          einem Menschen geprüft, bevor sie umgesetzt werden.
        </p>
      </LegalSection>

      <LegalSection title="9. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)">
        <p>
          Transportverschlüsselung, anbieterseitige Verschlüsselung im Ruhezustand,
          rollen- und fallbezogene Zugriffskontrolle, MFA für sensible Bereiche sowie
          Protokollierung ausgewählter sicherheitsrelevanter Aktionen. Angaben zu Hostingregion,
          Backups, Wiederherstellungstests und Unterauftragnehmern werden anhand der tatsächlichen
          Produktionskonfiguration in den technischen und organisatorischen Maßnahmen dokumentiert.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
