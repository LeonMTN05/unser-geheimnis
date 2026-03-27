import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "So funktioniert's — Verschlüsselung erklärt | unser-geheimnis.de",
  description:
    "Wie funktioniert das sichere Teilen von Passwörtern? Wir erklären unsere Ende-zu-Ende-Verschlüsselung, das Zero-Knowledge-Prinzip und den gesamten Ablauf verständlich.",
  keywords: [
    "Passwort sicher teilen wie funktioniert",
    "Ende-zu-Ende-Verschlüsselung erklärt",
    "Zero-Knowledge Verschlüsselung",
    "AES-256 Verschlüsselung einfach erklärt",
    "DSGVO Passwort-Sharing",
  ],
  alternates: { canonical: "https://unser-geheimnis.de/so-funktionierts" },
  openGraph: {
    title: "So funktioniert sicheres Passwort-Teilen | unser-geheimnis.de",
    description:
      "Verständliche Erklärung: Wie Ende-zu-Ende-Verschlüsselung, Zero-Knowledge und automatische Löschung zusammenwirken.",
    url: "https://unser-geheimnis.de/so-funktionierts",
    locale: "de_DE",
    type: "article",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Kann unser-geheimnis.de meine Passwörter lesen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nein. Der Schlüssel zum Entschlüsseln verlässt nie Ihren Browser. Er steht ausschließlich im URL-Fragment (nach dem #), das der Browser nie an den Server sendet.",
      },
    },
    {
      "@type": "Question",
      name: "Was ist Ende-zu-Ende-Verschlüsselung?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ende-zu-Ende-Verschlüsselung bedeutet: Die Daten werden beim Sender verschlüsselt und erst beim Empfänger entschlüsselt. Kein Zwischensystem — auch nicht unser Server — kann den Inhalt lesen.",
      },
    },
    {
      "@type": "Question",
      name: "Was passiert mit meinen Daten nach dem Abruf?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Das Geheimnis wird sofort und unwiderruflich gelöscht — aus der Datenbank und vom Dateisystem. Bei Dateien werden die Daten vor der Löschung mit Zufallsdaten überschrieben.",
      },
    },
    {
      "@type": "Question",
      name: "Ist der Dienst DSGVO-konform?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Es werden keine personenbezogenen Daten gespeichert — keine IP-Adressen, keine E-Mail-Adressen, keine Cookies, kein Tracking. Die verschlüsselten Blobs sind für uns technisch nicht lesbar.",
      },
    },
  ],
};

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-mono font-bold text-lg">
        {number}
      </div>
      <div>
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border border-border rounded-xl p-6">
      <h3 className="text-text-primary font-semibold mb-3">{question}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{answer}</p>
    </div>
  );
}

export default function SoFunktionierts() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex-grow flex flex-col items-center p-6 mx-auto w-full max-w-3xl mt-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-accent text-sm font-medium mb-6">
            <span>🔐</span>
            <span>Zero-Knowledge erklärt</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-text-primary mb-6">
            So funktioniert&apos;s
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Wie Ende-zu-Ende-Verschlüsselung, Zero-Knowledge und automatische
            Löschung zusammenwirken — verständlich erklärt.
          </p>
        </div>

        {/* Ablauf */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-8">
            Der vollständige Ablauf
          </h2>
          <div className="space-y-10">
            <Step
              number={1}
              icon="✍️"
              title="Du gibst dein Geheimnis ein"
              description="Text (Passwort, API-Key, Notiz) oder Datei (bis 16 MB) — direkt im Browser. Nichts verlässt noch deinen Computer."
            />
            <Step
              number={2}
              icon="🔑"
              title="Dein Browser erzeugt einen einzigartigen Schlüssel"
              description="Die Web Crypto API generiert einen 256-bit AES-GCM-Schlüssel — zufällig, einmalig, ausschließlich in deinem Browser. Der Schlüssel verlässt deinen Browser nie."
            />
            <Step
              number={3}
              icon="🔒"
              title="Verschlüsselung direkt im Browser"
              description="Dein Geheimnis wird clientseitig verschlüsselt (AES-256-GCM). Nur das verschlüsselte Daten-Blob wird an unseren Server gesendet — niemals der Klartext oder der Schlüssel."
            />
            <Step
              number={4}
              icon="🔗"
              title="Du erhältst einen einmaligen Link"
              description='Der Schlüssel wird Base64url-kodiert ins URL-Fragment eingefügt: https://unser-geheimnis.de/s/{id}#SCHLÜSSEL — das Fragment (#…) wird vom Browser niemals an den Server übertragen. Das ist ein Browser-Standard, keine Policy.'
            />
            <Step
              number={5}
              icon="📨"
              title="Du teilst den Link"
              description="Per E-Mail, Chat, SMS — wie du möchtest. Der Empfänger benötigt keinen Account, keine App, nur einen modernen Browser."
            />
            <Step
              number={6}
              icon="🔓"
              title="Empfänger öffnet und entschlüsselt"
              description="Der Browser des Empfängers liest das Fragment, lädt das verschlüsselte Blob vom Server und entschlüsselt es lokal. Der Klartext wird ausschließlich im Browser angezeigt — nie auf dem Server."
            />
            <Step
              number={7}
              icon="🔥"
              title="Automatische Löschung"
              description="Nach dem ersten Abruf (Burn-After-Read) wird das Geheimnis sofort und unwiderruflich gelöscht — aus der Datenbank und vom Dateisystem. Bei Dateien werden die Daten zuerst mit Zufallsdaten überschrieben."
            />
          </div>
        </section>

        {/* Zero-Knowledge-Erklärung */}
        <section className="w-full mb-16 bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-serif text-text-primary mb-4">
            Was bedeutet Zero-Knowledge?
          </h2>
          <p className="text-text-secondary leading-relaxed mb-6">
            Zero-Knowledge bedeutet: <strong className="text-text-primary">Wir wissen nichts über deinen Inhalt.</strong>{" "}
            Nicht weil wir es versprechen — sondern weil es technisch unmöglich ist.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-danger mb-2">Was wir NICHT sehen:</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>❌ Den Klartext deines Geheimnisses</li>
                <li>❌ Den Entschlüsselungsschlüssel</li>
                <li>❌ Wer das Geheimnis erstellt hat</li>
                <li>❌ Wer es abgerufen hat</li>
                <li>❌ IP-Adressen (außer temporär für Rate-Limiting)</li>
              </ul>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-accent mb-2">Was wir sehen:</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>✅ Einen verschlüsselten Datensatz (unlesbar)</li>
                <li>✅ Den Ablaufzeitpunkt</li>
                <li>✅ Den Dateityp (TEXT/FILE)</li>
                <li>✅ Die Dateigröße (optional)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technik-Details */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-6">
            Technische Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "AES-256-GCM",
                desc: "Militärgrade-Verschlüsselung. 256-bit-Schlüssel, Galois/Counter-Mode für authentifizierte Verschlüsselung. Industriestandard seit 2001.",
              },
              {
                title: "Web Crypto API",
                desc: "Native Browser-API, kein externes Krypto-JavaScript. Läuft in einem sicheren Kontext ohne Zugriff von außen.",
              },
              {
                title: "URL-Fragment (#)",
                desc: "Das Fragment einer URL wird vom Browser niemals an den Server gesendet — nicht in Logs, nicht in Requests. W3C-Standard seit 1994.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-xl p-5"
              >
                <h3 className="text-accent font-mono font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full mb-16">
          <h2 className="text-2xl font-serif text-text-primary mb-6">
            Häufige Fragen
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="Kann unser-geheimnis.de meine Passwörter lesen?"
              answer="Nein. Der Schlüssel verlässt deinen Browser nie. Er steht ausschließlich im URL-Fragment (#), das der Browser nie an den Server übermittelt. Wir sehen nur einen verschlüsselten Datensatz, der für uns genauso unlesbar ist wie für jeden anderen ohne den Link."
            />
            <FaqItem
              question="Was passiert, wenn ich den Link zweimal öffne?"
              answer='Bei aktiviertem "Burn-After-Read" (Standard) wird das Geheimnis nach dem ersten Abruf sofort gelöscht. Jeder weitere Aufruf gibt einen 404-Fehler zurück — das Geheimnis existiert nicht mehr.'
            />
            <FaqItem
              question="Was passiert, wenn das Geheimnis nicht abgerufen wird?"
              answer="Alle Geheimnisse haben eine maximale Gültigkeitsdauer von 1–48 Stunden. Danach werden sie automatisch durch einen Scheduler gelöscht — unabhängig davon, ob sie je abgerufen wurden."
            />
            <FaqItem
              question="Ist der Dienst DSGVO-konform?"
              answer="Ja. Es werden keine personenbezogenen Daten gespeichert. Kein Tracking, keine Cookies, keine IP-Speicherung, keine externen Skripte. Die technische Unmöglichkeit des Auslesens macht die Verschlüsselungsdaten per DSGVO zu keinen personenbezogenen Daten."
            />
            <FaqItem
              question="Wer betreibt unser-geheimnis.de?"
              answer="Der Dienst wird in Deutschland betrieben und gehostet. Alle Daten verbleiben in der EU. Details im Impressum."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="w-full text-center bg-card border border-border rounded-2xl p-10 mb-4">
          <h2 className="text-2xl font-serif text-text-primary mb-4">
            Bereit? Erstelle dein erstes Geheimnis.
          </h2>
          <p className="text-text-secondary mb-6">
            Kostenlos, ohne Registrierung, ohne Tracking.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            🔐 Jetzt Geheimnis erstellen
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
