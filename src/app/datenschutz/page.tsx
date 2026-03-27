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
        <p className="text-text-muted text-sm mb-10">Stand: März 2026 · Gemäß Art. 13 DSGVO</p>

        <div className="space-y-10 text-sm leading-relaxed w-full">

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Verantwortlicher</h2>
            <p className="text-text-secondary">
              Verantwortlicher im Sinne der DSGVO ist die im <a href="/impressum" className="text-accent hover:underline">Impressum</a> genannte natürliche Person.
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
                <p className="mt-2 text-text-muted">IP-Adressen werden <strong className="text-text-secondary">nicht gespeichert</strong>. Sie werden ausschließlich temporär (im RAM) für das Rate-Limiting verwendet und nicht protokolliert.</p>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">3.2 Beim Abrufen eines Geheimnisses</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Der verschlüsselte Datensatz wird übermittelt und sofort danach gelöscht (bei aktiviertem Burn-After-Read)</li>
                  <li>Keine Speicherung von IP-Adresse, User-Agent oder sonstigen Metadaten</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">3.3 Server-Logs</p>
                <p>
                  Unser Webserver protokolliert technisch bedingt: HTTP-Statuscode, Anfragezeitstempel und -methode sowie Datenmenge. <strong className="text-text-secondary">IP-Adressen werden im Webserver-Log nicht dauerhaft gespeichert</strong> bzw. nach spätestens 7 Tagen automatisch gelöscht und sind auf die letzten 8 Bit gekürzt (Anonymisierung).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Speicherdauer und Löschung</h2>
            <p className="text-text-secondary mb-3">
              Geheimnisse werden <strong className="text-text-primary">spätestens nach 48 Stunden</strong> automatisch und unwiderruflich gelöscht — unabhängig davon, ob sie abgerufen wurden.
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
              Das temporäre Rate-Limiting (IP im RAM) stützt sich auf <strong className="text-text-primary">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse: Schutz vor Missbrauch).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Cookies, Tracking und externe Dienste</h2>
            <p className="text-text-secondary">
              Diese Website verwendet <strong className="text-text-primary">keine Cookies</strong>, kein Google Analytics, keine Tracking-Pixel, keine Fingerprinting-Technologien und keine sozialen Plugins.
              Es werden <strong className="text-text-primary">keine Daten an Dritte übermittelt</strong>.
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
              Hinweis: Da wir keine personenbezogenen Daten verarbeiten und keine Benutzerkonten führen, ist eine Zuordnung von Anfragen zu Personen technisch nicht möglich.
              Gespeicherte Geheimnisse können nicht einer Person zugeordnet werden.
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
