import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | unser-geheimnis.de",
  description: "Datenschutzerklärung gemäß DSGVO für unser-geheimnis.de — Zero-Knowledge, kein Tracking, automatische Löschung.",
  robots: { index: true, follow: false },
};

export default function Datenschutz() {
  return (
    <>
      <main className="flex-grow flex flex-col items-start justify-start p-6 mx-auto w-full max-w-3xl mt-12">
        <h1 className="text-4xl font-serif text-text-primary mb-2">Datenschutzerklärung</h1>
        <p className="text-text-muted text-sm mb-10">Stand: November 2026 · Gemäß Art. 13 DSGVO</p>

        <div className="space-y-10 text-sm leading-relaxed w-full">

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Verantwortlicher</h2>
            <p className="text-text-secondary">
              Verantwortlicher im Sinne der DSGVO ist der im <a href="/impressum" className="text-accent hover:underline">Impressum</a> genannte Betreiber dieser Website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. Zero-Knowledge-Prinzip — Grundsatz der Datenverarbeitung</h2>
            <p className="text-text-secondary mb-3">
              Alle Geheimnisse (Texte, Passwörter, Dateien) werden <strong className="text-text-primary">ausschließlich im Browser des Nutzers</strong> mittels AES-256-GCM verschlüsselt, bevor sie an unseren Server übermittelt werden.
              Der Entschlüsselungsschlüssel verbleibt ausschließlich im URL-Fragment des generierten Links (nach dem <code className="text-accent">#</code>).
              URL-Fragmente werden vom Browser technisch bedingt nicht an den Server übertragen.
            </p>
            <p className="text-text-secondary">
              <strong className="text-text-primary">Wir können Ihre Geheimnisse zu keinem Zeitpunkt lesen, analysieren oder wiederherstellen.</strong>{" "}
              Auf unserem Server befinden sich ausschließlich verschlüsselte Datensätze ohne zugehörigen Schlüssel.
              Da wir keinen Zugriff auf den Klartext haben, handelt es sich bei diesen Datensätzen nach unserem Verständnis nicht um personenbezogene Daten im Sinne des Art. 4 Nr. 1 DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. Welche Daten werden verarbeitet?</h2>
            <div className="space-y-4 text-text-secondary">
              <div>
                <p className="font-medium text-text-primary mb-1">3.1 Beim Erstellen eines Geheimnisses</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verschlüsselter Datensatz (für uns nicht lesbar)</li>
                  <li>Initialisierungsvektor (IV, kein Sicherheitsrisiko ohne Schlüssel)</li>
                  <li>Typ (TEXT oder FILE), Dateigröße und MIME-Typ (bei Dateien)</li>
                  <li>Gewählte Gültigkeitsdauer (TTL)</li>
                  <li>Zeitstempel der Erstellung</li>
                </ul>
                <p className="mt-2 text-text-muted">IP-Adressen werden <strong className="text-text-secondary">nicht im Klartext gespeichert</strong>. Für das Rate-Limiting (Missbrauchsschutz) speichern wir ausschließlich einen mit einem geheimen Schlüssel gebildeten Hash (HMAC) der IP-Adresse samt Zeitstempel; diese Einträge werden nach spätestens 48 Stunden automatisch gelöscht.</p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">3.2 Beim Abrufen eines Geheimnisses</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Der verschlüsselte Datensatz wird übermittelt und sofort danach gelöscht (bei aktiviertem Burn-After-Read)</li>
                  <li>Keine Speicherung von IP-Adresse, User-Agent oder sonstigen Metadaten</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">3.3 Daten anfordern</p>
                <p className="mb-2">
                  Bei einer Datenanfrage erzeugt der Browser des Anfragenden ein Schlüsselpaar. Wir speichern nur den öffentlichen Schlüssel,
                  die optionale Nachricht und den optionalen Namen des Anfragenden sowie die Gültigkeitsdauer. Die Antwort wird im Browser des
                  Antwortenden verschlüsselt; nur der Anfragende kann sie mit seinem privaten Schlüssel (nur im Abruf-Link) entschlüsseln.
                </p>
                <p className="mb-1">Wird die Anfrage per E-Mail versendet, verarbeiten wir zusätzlich:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>E-Mail-Adresse des Anfragenden (für den Bestätigungscode, als bestätigter Absender in der Einladung und für die Benachrichtigung über eine Antwort)</li>
                  <li>E-Mail-Adresse des Empfängers (für den Versand der Einladung)</li>
                  <li>Bestätigungscode und -link nur als Hash, ungültig nach 30 Minuten</li>
                </ul>
                <p className="mt-2 text-text-muted">
                  Beide E-Mail-Adressen werden zusammen mit der Anfrage gelöscht, also nach dem Abruf der Antwort, spätestens mit Ablauf der Gültigkeit
                  (max. 48 Stunden) bzw. nach 30 Minuten, wenn die Anfrage nicht bestätigt wird. Für die Missbrauchsbegrenzung (z. B. max. Anfragen pro Adresse
                  und Tag) speichern wir nur einen nicht umkehrbaren Hash (HMAC) der Adressen, der nach 48 Stunden gelöscht wird. Wer sich über den Link in der
                  E-Mail abmeldet, wird dauerhaft als Hash auf einer Sperrliste geführt, damit keine weiteren E-Mails an diese Adresse gehen.
                </p>
                <p className="mt-2 text-text-muted">
                  Damit der Link in der Benachrichtigungs-Mail die Antwort direkt öffnen kann, speichert die Website den Abruf-Link im lokalen
                  Speicher (localStorage) <strong className="text-text-secondary">Ihres eigenen Browsers</strong>. Er wird nicht an uns übertragen und nach dem Abruf
                  bzw. nach Ablauf der Anfrage entfernt. Diese Speicherung ist für die von Ihnen angeforderte Funktion technisch erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
                </p>
                <p className="mt-2 text-text-muted">
                  Zum Schutz vor automatisiertem Missbrauch löst der Browser eine kurze Rechenaufgabe (Proof-of-Work). Dabei werden keine Cookies gesetzt und
                  keine Drittanbieter eingebunden.
                </p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">3.4 Server-Logs</p>
                <p>
                  Unser Webserver protokolliert technisch bedingt: HTTP-Statuscode, Anfragezeitstempel und -methode sowie Datenmenge. <strong className="text-text-secondary">IP-Adressen werden im Webserver-Log nicht dauerhaft gespeichert</strong> bzw. nach spätestens 7 Tagen automatisch gelöscht und sind auf die letzten 8 Bit gekürzt (Anonymisierung).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Speicherdauer und Löschung</h2>
            <p className="text-text-secondary mb-3">
              Geheimnisse und Datenanfragen werden <strong className="text-text-primary">spätestens nach 48 Stunden</strong> automatisch und unwiderruflich gelöscht — unabhängig davon, ob sie abgerufen wurden.
              Bei aktivierter „Burn-After-Read"-Option erfolgt die Löschung <strong className="text-text-primary">sofort nach dem ersten Abruf</strong>.
            </p>
            <p className="text-text-secondary">
              Die Löschung umfasst: Entfernung aus der Datenbank sowie — bei Dateien — das Überschreiben mit Zufallsdaten vor dem Löschen vom Dateisystem (Secure Delete).
              Eine Wiederherstellung ist technisch nicht möglich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Rechtsgrundlage</h2>
            <p className="text-text-secondary">
              Die Verarbeitung der verschlüsselten Datensätze erfolgt zur Erbringung des Dienstes auf Grundlage von <strong className="text-text-primary">Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung / vorvertragliche Maßnahmen auf Anfrage des Nutzers).
              Der Versand von Datenanfragen per E-Mail erfolgt auf Veranlassung des Anfragenden (Art. 6 Abs. 1 lit. b DSGVO). Die Verarbeitung der
              Empfängeradresse stützt sich auf <strong className="text-text-primary">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse des Anfragenden an der
              Zustellung; der Empfänger kann jederzeit über den Abmeldelink widersprechen).
              Rate-Limiting, Sperrliste und Proof-of-Work stützen sich auf <strong className="text-text-primary">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse: Schutz vor Missbrauch).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Cookies, Tracking und externe Dienste</h2>
            <p className="text-text-secondary">
              Diese Website verwendet <strong className="text-text-primary">keine Cookies</strong>, kein Google Analytics, keine Tracking-Pixel, keine Fingerprinting-Technologien und keine sozialen Plugins.
              Es werden <strong className="text-text-primary">keine Daten an Dritte übermittelt</strong>, mit einer Ausnahme: Für den Versand von E-Mails (nur bei der
              Funktion „Daten anfordern“ mit E-Mail-Versand) nutzen wir einen E-Mail-Dienstleister als Auftragsverarbeiter (Art. 28 DSGVO). Übermittelt werden
              dabei nur die für den Versand nötigen Daten (Adressen und E-Mail-Inhalt), niemals verschlüsselte Inhalte oder Schlüssel.
              Sämtliche Schriftarten (Fonts) werden lokal auf unserem Server bereitgestellt — es erfolgt kein Aufruf von Google Fonts oder anderen CDN-Diensten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Hosting und Serverstandort</h2>
            <p className="text-text-secondary">
              Der Dienst wird auf Servern in <strong className="text-text-primary">Deutschland</strong> betrieben. Die Daten verlassen die Europäische Union nicht.
              Mit dem Hosting-Anbieter besteht ein Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Ihre Rechte</h2>
            <p className="text-text-secondary mb-3">Sie haben nach DSGVO folgende Rechte gegenüber uns:</p>
            <ul className="list-disc pl-5 space-y-1 text-text-secondary">
              <li><strong className="text-text-primary">Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über Sie gespeichert haben</li>
              <li><strong className="text-text-primary">Berichtigung</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten</li>
              <li><strong className="text-text-primary">Löschung</strong> (Art. 17 DSGVO): Löschung Ihrer Daten</li>
              <li><strong className="text-text-primary">Einschränkung</strong> (Art. 18 DSGVO): Einschränkung der Verarbeitung</li>
              <li><strong className="text-text-primary">Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen die Verarbeitung</li>
              <li><strong className="text-text-primary">Beschwerde</strong> bei der zuständigen Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
            <p className="mt-3 text-text-muted">
              Hinweis: Wir führen keine Benutzerkonten. Gespeicherte Geheimnisse können nicht einer Person zugeordnet werden. E-Mail-Adressen bei Datenanfragen
              werden nur für die kurze Laufzeit der Anfrage gespeichert (siehe 3.3).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Kontakt bei Datenschutzfragen</h2>
            <p className="text-text-secondary">
              Bei Fragen zum Datenschutz wenden Sie sich bitte an die im <a href="/impressum" className="text-accent hover:underline">Impressum</a> genannte E-Mail-Adresse.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
