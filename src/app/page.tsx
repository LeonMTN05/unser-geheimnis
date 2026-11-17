import Link from "next/link";
import { SecretCreator } from "@/components/ui/SecretCreator";
import { Footer } from "@/components/ui/Footer";
import { Icon, type IconName } from "@/components/ui/Icons";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "unser-geheimnis.de",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web",
    description:
      "Teile Passwörter, API-Keys und Dateien verschlüsselt und DSGVO-konform. Ende-zu-Ende-Verschlüsselung, automatische Löschung nach dem ersten Lesen.",
    url: "https://unser-geheimnis.de",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-grow flex flex-col items-center w-full overflow-hidden">

        {/* ── HERO ── */}
        <section className="relative w-full flex flex-col items-center px-6 pt-20 pb-16 text-center">
          {/* Subtile Hintergrund-Glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute top-20 -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-3xl" />
            <div className="absolute top-10 -right-40 w-[350px] h-[350px] rounded-full bg-accent/4 blur-3xl" />
          </div>

          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            DSGVO-konform · Zero-Knowledge · Made in Germany
          </div>

          {/* Headline */}
          <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-serif text-text-primary mb-6 leading-[1.1] tracking-tight max-w-3xl text-balance">
            Teile sensible Daten.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">
              Verschlüsselt. Einmalig. Spurlos.
            </span>
          </h1>

          <p className="relative text-text-secondary text-lg max-w-xl mb-10 leading-relaxed text-pretty">
            Passwörter, API-Keys und Zugangsdaten sicher an Kunden oder Kollegen übertragen —
            ohne Drittanbieter-Risiken, ohne Logs, ohne Spuren.
          </p>

          {/* Trust-Pills */}
          <div className="relative flex flex-wrap justify-center gap-3 mb-4 text-xs text-text-muted">
            {["AES-256-GCM", "Schlüssel nur im Link", "Burn-after-read", "Hosting in Deutschland", "Kein Tracking"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-bg-secondary/60 text-text-secondary">
                <svg className="w-3 h-3 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* ── FORMULAR ── */}
        <section className="relative w-full max-w-5xl px-6 pb-20">
          <SecretCreator />
        </section>

        {/* ── WIE FUNKTIONIERT'S ── */}
        <section className="w-full bg-bg-secondary border-y border-border py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">So einfach geht's</p>
              <h2 className="text-3xl font-serif text-text-primary">In 3 Schritten zum sicheren Link</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Verbindungslinie (Desktop) */}
              <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-accent/20 via-accent/50 to-accent/20" />

              {[
                {
                  step: "01",
                  icon: "pencil" as IconName,
                  title: "Eingeben",
                  desc: "Text, Passwort, API-Key oder Datei — direkt im Browser eingeben. Nichts verlässt noch deinen Computer.",
                },
                {
                  step: "02",
                  icon: "link" as IconName,
                  title: "Verschlüsseln & Teilen",
                  desc: "Dein Browser verschlüsselt die Daten lokal. Du erhältst einen einmaligen Link — der Schlüssel steckt nur im Link-Fragment.",
                },
                {
                  step: "03",
                  icon: "flame" as IconName,
                  title: "Lesen & Vergessen",
                  desc: "Empfänger öffnet den Link, entschlüsselt lokal. Danach: sofortige, unwiderrufliche Löschung vom Server.",
                },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="relative flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-full bg-bg-card border-2 border-accent/30 flex items-center justify-center mb-4 shadow-lg shadow-accent/5">
                    <Icon name={icon} className="w-7 h-7 text-accent" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-bg-primary text-xs font-bold flex items-center justify-center">
                      {step.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/so-funktionierts" className="text-accent text-sm hover:underline">
                Detaillierte Erklärung mit technischen Hintergründen →
              </Link>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="w-full max-w-5xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-accent text-sm font-medium mb-3 tracking-wide uppercase">Warum unser-geheimnis.de?</p>
            <h2 className="text-3xl font-serif text-text-primary">Sicherheit ohne Kompromisse</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "shield" as IconName,
                title: "Zero-Knowledge",
                desc: "Dein Geheimnis wird im Browser verschlüsselt. Der Schlüssel existiert ausschließlich im Link. Wir können deine Daten physikalisch nicht lesen — kein Admin, kein Hacker.",
              },
              {
                icon: "flame" as IconName,
                title: "Burn-after-read",
                desc: "Sobald der Empfänger den Link öffnet, wird der Datensatz sofort und unwiderruflich gelöscht. Dateien werden vor der Löschung mit Zufallsdaten überschrieben.",
              },
              {
                icon: "eu" as IconName,
                title: "100% DSGVO-konform",
                desc: "Kein Google Analytics. Keine Cookies. Kein Tracking. Hosting ausschließlich in Deutschland. Keine personenbezogenen Daten gespeichert.",
              },
              {
                icon: "file" as IconName,
                title: "Dateien bis 16 MB",
                desc: "Nicht nur Text — auch Dateien, Zertifikate, SSH-Keys oder Konfigurationsdateien verschlüsselt übermitteln.",
              },
              {
                icon: "clock" as IconName,
                title: "Flexible Laufzeit",
                desc: "Gültigkeitsdauer von 1 bis 48 Stunden wählbar. Abgelaufene Geheimnisse werden automatisch gelöscht.",
              },
              {
                icon: "bolt" as IconName,
                title: "Kein Account nötig",
                desc: "Einfach öffnen und loslegen. Keine Registrierung, keine App, kein Login — für Ersteller und Empfänger.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl bg-bg-secondary border border-border hover:border-accent/30 hover:bg-bg-card hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20 text-accent group-hover:bg-accent/15 transition-colors">
                  <Icon name={icon} className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-text-primary font-semibold mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST / ZERO-KNOWLEDGE-ERKLÄRUNG ── */}
        <section className="w-full bg-bg-secondary border-t border-border py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/25 text-accent shadow-[0_0_40px_rgba(6,214,160,0.15)]"><Icon name="lock" className="w-8 h-8" /></div>
            <h2 className="text-3xl font-serif text-text-primary mb-5">
              Selbst wir können dein Geheimnis nicht lesen.
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6 max-w-2xl mx-auto">
              Der Schlüssel zu deinen Daten verlässt nie deinen Browser. Er wird ausschließlich im Link
              gespeichert, den du teilst — nicht auf unserem Server. Wir speichern nur einen
              verschlüsselten Datensatz, der für uns genauso unlesbar ist wie für jeden anderen ohne den
              Link. Kein Admin, kein Hacker, kein Gericht kann den Inhalt entschlüsseln, weil der
              Schlüssel technisch nie bei uns ankommt.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/so-funktionierts"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-xl transition-colors"
              >
                Wie das technisch funktioniert →
              </Link>
              <Link
                href="/fuer-unternehmen"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:border-accent/30 text-text-secondary hover:text-text-primary rounded-xl transition-colors"
              >
                Für Unternehmen & IT-Teams
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
