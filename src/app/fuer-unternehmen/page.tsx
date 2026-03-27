import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Für Unternehmen — DSGVO-konformes Passwort-Sharing | unser-geheimnis.de",
  description:
    "Sichere Übergabe von Passwörtern, Zugangsdaten und API-Keys im Team und an Kunden. DSGVO-konform, Zero-Knowledge, kein Account nötig. Ideal für IT-Abteilungen, MSPs und Agenturen.",
  keywords: [
    "Passwort sicher teilen Unternehmen",
    "Zugangsdaten DSGVO-konform weitergeben",
    "IT-Sicherheit Passwort-Sharing",
    "MSP Zugangsdaten Tool",
    "API-Key sicher übermitteln",
    "Onboarding Passwörter verschlüsselt",
  ],
  alternates: { canonical: "https://unser-geheimnis.de/fuer-unternehmen" },
  openGraph: {
    title: "Für Unternehmen — Sicheres Passwort-Sharing | unser-geheimnis.de",
    description:
      "DSGVO-konformes Teilen von Zugangsdaten, API-Keys und sensiblen Informationen — ohne Tracking, ohne Account, mit Ende-zu-Ende-Verschlüsselung.",
    url: "https://unser-geheimnis.de/fuer-unternehmen",
    locale: "de_DE",
    type: "website",
  },
};

function UseCase({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-text-primary font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Benefit({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 text-2xl">{icon}</div>
      <div>
        <h3 className="text-text-primary font-semibold mb-1">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function FuerUnternehmen() {
  return (
    <>
      <main className="flex-grow flex flex-col items-center p-6 mx-auto w-full max-w-3xl mt-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-accent text-sm font-medium mb-6">
            <span>🏢</span>
            <span>Für IT-Teams & Unternehmen</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-text-primary mb-6">
            Zugangsdaten sicher teilen —{" "}
            <span className="text-accent">ohne Risiko</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Kein Passwort per E-Mail. Kein Screenshot im Chat.
            Ende-zu-Ende-verschlüsselt, DSGVO-konform, spurlos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              🔐 Jetzt kostenlos nutzen
            </Link>
            <Link
              href="/so-funktionierts"
              className="inline-flex items-center gap-2 border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary px-8 py-3 rounded-xl transition-colors"
            >
              Wie es funktioniert →
            </Link>
          </div>
        </div>

        {/* Das Problem */}
        <section className="w-full mb-16 bg-danger/5 border border-danger/20 rounded-2xl p-8">
          <h2 className="text-xl font-serif text-text-primary mb-4">
            Das Problem: Wie werden Passwörter heute geteilt?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              "❌ Per E-Mail — bleibt jahrelang im Postfach",
              "❌ Per WhatsApp/Slack — in Cloud-Backups gespeichert",
              "❌ Per SMS — ohne Verschlüsselung",
              "❌ Per Sticky Note am Monitor — kein Kommentar",
              "❌ Per Passwort-Manager-Export — unkontrollierter Zugriff",
              "❌ Per Screenshot — iCloud/Google Fotos synchronisiert",
            ].map((item) => (
              <div key={item} className="text-text-secondary">
                {item}
              </div>
            ))}
          </div>
          <p className="text-text-secondary text-sm mt-4 leading-relaxed">
            Jede dieser Methoden hinterlässt Spuren — in Logs, Backups, Cloud-Diensten.
            Eines Tages wird es zum Problem: DSGVO-Verstoß, Datenleck, Kündigung.
          </p>
        </section>

        {/* Anwendungsfälle */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-8">
            Typische Anwendungsfälle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UseCase
              icon="🔧"
              title="IT-Abteilungen & MSPs"
              description="Übergabe von Server-Passwörtern, RDP-Zugängen, WLAN-Credentials oder Admin-Accounts an Kunden — einmalig, spurlos, mit definiertem Ablauf."
            />
            <UseCase
              icon="🚀"
              title="Onboarding neuer Mitarbeiter"
              description="Temporäre Zugangsdaten, VPN-Credentials oder Initial-Passwörter sicher übergeben. Nach dem ersten Login automatisch gelöscht."
            />
            <UseCase
              icon="💻"
              title="Entwickler & DevOps"
              description="API-Keys, Secret-Tokens, Deploy-Credentials oder SSH-Keys sicher an Kollegen oder Auftraggeber übermitteln — ohne Git, ohne Slack-Verlauf."
            />
            <UseCase
              icon="🏦"
              title="Agenturen & Dienstleister"
              description="Zugangsdaten für Websites, CMS-Logins, Hosting-Accounts oder Social-Media-Profile an Kunden übergeben — ohne E-Mail-Risiko."
            />
            <UseCase
              icon="⚖️"
              title="Kanzleien & Steuerberater"
              description="Passwörter für DATEV, digitale Behördenportale oder Mandanten-Zugänge rechtskonform und spurlos weitergeben."
            />
            <UseCase
              icon="🏥"
              title="Gesundheitswesen"
              description="Zugangsdaten für Praxis-Software, KIS-Systeme oder Telemedizin-Portale — DSGVO-Pflichten entsprechend sicher übermitteln."
            />
          </div>
        </section>

        {/* Vorteile */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-8">
            Warum unser-geheimnis.de?
          </h2>
          <div className="space-y-8">
            <Benefit
              icon="🔐"
              title="Ende-zu-Ende-Verschlüsselt — keine Ausnahmen"
              description="Der Schlüssel verlässt nie den Browser des Erstellers. Weder unser Server, noch Admin, noch Behörden können den Inhalt entschlüsseln. Das ist keine Policy, sondern eine technische Garantie."
            />
            <Benefit
              icon="🇩🇪"
              title="DSGVO-konform, Hosting in Deutschland"
              description="Kein US-amerikanisches Unternehmen, kein Cloudflare, kein Vercel. Alle Daten liegen auf Servern in Deutschland. Kein Tracking, keine Cookies, keine externen Ressourcen."
            />
            <Benefit
              icon="🔥"
              title="Automatische Löschung — unwiderruflich"
              description='Burn-After-Read: Das Geheimnis wird nach dem ersten Abruf sofort gelöscht. Alternativ: TTL von 1–48 Stunden. Dateien werden vor der Löschung mit Zufallsdaten überschrieben ("Secure Delete").'
            />
            <Benefit
              icon="⚡"
              title="Kein Account, keine App, keine Einrichtung"
              description="Einfach öffnen, eingeben, Link teilen. Der Empfänger braucht keinen Account. Funktioniert auf jedem Gerät mit modernem Browser. Sofort einsatzbereit."
            />
            <Benefit
              icon="📁"
              title="Auch für Dateien bis 16 MB"
              description="Nicht nur Text: Verschlüsselte Übertragung von Konfigurationsdateien, Zertifikaten, SSH-Keys oder anderen sensiblen Dateien — gleicher Zero-Knowledge-Standard."
            />
            <Benefit
              icon="🆓"
              title="Kostenlos"
              description="Der Dienst ist kostenlos nutzbar. Keine versteckten Gebühren, keine Premium-Features hinter Paywalls, keine Datenaggregation als Geschäftsmodell."
            />
          </div>
        </section>

        {/* Compliance-Box */}
        <section className="w-full mb-16 bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-serif text-text-primary mb-4">
            Compliance & Rechtssicherheit
          </h2>
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              <strong className="text-text-primary">DSGVO Art. 32:</strong> Technische und organisatorische Maßnahmen zum Schutz personenbezogener Daten — die Ende-zu-Ende-Verschlüsselung entspricht dem Stand der Technik (Art. 25 DSGVO).
            </p>
            <p>
              <strong className="text-text-primary">Kein Auftragsverarbeitungsvertrag (AVV) nötig:</strong> Da keine personenbezogenen Daten verarbeitet werden (verschlüsselte Blobs ohne Schlüssel), entfällt die AVV-Pflicht nach DSGVO.
            </p>
            <p>
              <strong className="text-text-primary">Minimale Datenerhebung (Art. 5 DSGVO):</strong> Keine IP-Adressen, keine E-Mails, keine Benutzerkonten. Nur der verschlüsselte Blob und der Ablaufzeitstempel — beides ohne Personenbezug.
            </p>
            <p>
              <strong className="text-text-primary">Nachweisbarkeit:</strong> Für Audits: Der Dienst protokolliert keine Zugriffe auf Geheimnis-Inhalte. Der Admin-Proof ist technisch garantiert.
            </p>
          </div>
        </section>

        {/* Vergleich */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-6">
            Vergleich mit Alternativen
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium py-3 pr-4">Feature</th>
                  <th className="text-center text-accent font-medium py-3 px-4">unser-geheimnis.de</th>
                  <th className="text-center text-text-muted font-medium py-3 px-4">E-Mail</th>
                  <th className="text-center text-text-muted font-medium py-3 px-4">Slack/Teams</th>
                  <th className="text-center text-text-muted font-medium py-3 px-4">OneTimeSecret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Ende-zu-Ende verschlüsselt", "✅", "❌", "⚠️ optional", "❌ serverseitig"],
                  ["Kein Klartext auf Server", "✅", "❌", "❌", "❌"],
                  ["Automatische Löschung", "✅", "❌", "❌", "✅"],
                  ["DSGVO-konform (DE-Hosting)", "✅", "⚠️", "❌", "❌ US"],
                  ["Kein Tracking / Cookies", "✅", "n/a", "❌", "❌"],
                  ["Datei-Upload", "✅ 16 MB", "✅", "✅", "❌"],
                  ["Zero-Knowledge", "✅", "❌", "❌", "❌"],
                ].map(([feature, ...rest]) => (
                  <tr key={feature}>
                    <td className="py-3 pr-4 text-text-secondary">{feature}</td>
                    {rest.map((val, i) => (
                      <td key={i} className="py-3 px-4 text-center text-text-secondary">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full text-center bg-card border border-border rounded-2xl p-10 mb-4">
          <h2 className="text-2xl font-serif text-text-primary mb-4">
            Sofort einsatzbereit — keine Registrierung
          </h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Einfach öffnen, Zugangsdaten eingeben, Link verschicken.
            In 30 Sekunden erledigt.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            🔐 Jetzt kostenfrei nutzen
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
