import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";
import { CodeBlock } from "@/components/ui/CodeBlock";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://unser-geheimnis.de").replace(/\/+$/, "");
const REPO = "https://github.com/LeonMTN05/unser-geheimnis";

export const metadata: Metadata = {
  title: "Self-Hosted — auf eigenem Server betreiben | unser-geheimnis.de",
  description:
    "unser-geheimnis selbst hosten: Installationsanleitung, Install-Script für Debian/Ubuntu, Reverse-Proxy, E-Mail-Konfiguration, Updates und Backups. Open Source unter MIT-Lizenz.",
  alternates: { canonical: "https://unser-geheimnis.de/self-hosted" },
  openGraph: {
    title: "unser-geheimnis selbst hosten",
    description: "Zero-Knowledge Secret-Sharing auf deinem eigenen Server — mit Install-Script in wenigen Minuten.",
    url: "https://unser-geheimnis.de/self-hosted",
    locale: "de_DE",
    type: "article",
  },
};

const TOC = [
  ["schnellstart", "Schnellstart"],
  ["voraussetzungen", "Voraussetzungen"],
  ["was-passiert", "Was das Script macht"],
  ["optionen", "Script-Optionen"],
  ["reverse-proxy", "Reverse-Proxy & HTTPS"],
  ["e-mail", "E-Mail (Daten anfordern)"],
  ["konfiguration", "Konfiguration (.env)"],
  ["updates", "Updates & Backups"],
  ["anpassen", "Impressum & Branding"],
  ["manuell", "Manuelle Installation"],
  ["sicherheit", "Sicherheitshinweise"],
  ["deinstallation", "Deinstallation"],
] as const;

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-serif text-text-primary mt-16 mb-4">
      <a href={`#${id}`} className="hover:text-accent transition-colors">{children}</a>
    </h2>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-text-secondary leading-relaxed mb-4">{children}</p>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-[0.85em] px-1.5 py-0.5 rounded bg-bg-elevated text-text-primary">{children}</code>
);

function Note({ tone = "info", title, children }: { tone?: "info" | "warn"; title: string; children: React.ReactNode }) {
  const cls = tone === "warn" ? "border-warning/30 bg-warning/5" : "border-accent/25 bg-accent/5";
  const head = tone === "warn" ? "text-warning" : "text-accent";
  return (
    <div className={`my-5 rounded-xl border p-4 text-sm leading-relaxed ${cls}`}>
      <p className={`font-semibold mb-1 ${head}`}>{title}</p>
      <div className="text-text-secondary">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm text-left">
        <thead className="bg-bg-secondary text-text-primary">
          <tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="text-text-secondary">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border align-top">
              {r.map((c, j) => <td key={j} className="px-4 py-2.5">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SelfHostedPage() {
  return (
    <>
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 pt-12 pb-20">
        {/* Kopf */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-accent text-sm font-medium mb-6">
            Open Source · MIT-Lizenz
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-text-primary mb-5 text-balance">
            unser-geheimnis auf deinem eigenen Server
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto text-pretty">
            Volle Kontrolle über Daten, Domain und Infrastruktur: Mit einem Install-Script läuft deine eigene Instanz
            in wenigen Minuten, mit derselben Zero-Knowledge-Verschlüsselung wie hier.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <a href="#schnellstart" className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-xl transition-colors">
              Zur Installation
            </a>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 border border-border hover:border-accent/30 text-text-secondary hover:text-text-primary rounded-xl transition-colors">
              Quellcode auf GitHub ↗
            </a>
            <a href="/install.sh" className="px-5 py-2.5 border border-border hover:border-accent/30 text-text-secondary hover:text-text-primary rounded-xl transition-colors">
              install.sh ansehen
            </a>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          {/* Inhaltsverzeichnis */}
          <nav aria-label="Inhalt" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-3">Inhalt</p>
              <ul className="space-y-2 text-sm">
                {TOC.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-text-secondary hover:text-accent transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
          </nav>

          <article className="min-w-0 max-w-3xl">
            {/* Schnellstart */}
            <h2 id="schnellstart" className="scroll-mt-24 text-2xl font-serif text-text-primary mb-4">Schnellstart</h2>
            <P>
              Auf einem frischen Debian- oder Ubuntu-Server mit einer Domain, die per DNS auf den Server zeigt:
            </P>
            <CodeBlock
              title="Installation"
              code={`curl -fsSL ${SITE}/install.sh -o install.sh
less install.sh          # Script vor dem Ausführen lesen
sudo bash install.sh --domain secrets.example.de --proxy caddy`}
            />
            <P>
              Nach drei bis fünf Minuten läuft deine Instanz unter <Code>https://secrets.example.de</Code>, mit
              automatischem HTTPS-Zertifikat von Let&apos;s Encrypt. Ohne Optionen fragt das Script alle Angaben interaktiv ab.
            </P>
            <Note title="Script vorher lesen">
              Führe niemals ein Script als root aus, das du nicht kennst. Das Installscript ist bewusst kurz, kommentiert und ohne
              Abhängigkeiten geschrieben. Du findest es auch im <a href={REPO} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Repository</a> unter <Code>public/install.sh</Code>.
            </Note>

            {/* Voraussetzungen */}
            <H2 id="voraussetzungen">Voraussetzungen</H2>
            <Table
              head={["", "Minimum", "Empfohlen"]}
              rows={[
                ["Betriebssystem", "Debian 12, Ubuntu 22.04", "Debian 12 / Ubuntu 24.04 LTS"],
                ["CPU / RAM", "1 vCPU, 1 GB RAM + 2 GB Swap", "2 vCPU, 2 GB RAM"],
                ["Speicher", "2 GB frei", "10 GB (Dateien bis 16 MB je Geheimnis)"],
                ["Netzwerk", "Domain mit A/AAAA-Record, Ports 80 + 443", "eigene Subdomain, z. B. secrets.firma.de"],
                ["Zugang", "root bzw. sudo", ""],
              ]}
            />
            <P>
              Node.js 22 installiert das Script bei Bedarf selbst. Als Datenbank dient SQLite, ein separater Datenbankserver ist nicht nötig.
            </P>

            {/* Was passiert */}
            <H2 id="was-passiert">Was das Script macht</H2>
            <ol className="list-decimal pl-5 space-y-2 text-text-secondary mb-4">
              <li>Prüft System, Arbeitsspeicher und Rechte.</li>
              <li>Installiert <Code>git</Code>, <Code>curl</Code>, <Code>openssl</Code> und Node.js 22 (NodeSource), falls nötig.</li>
              <li>Legt den Systembenutzer <Code>geheimnis</Code> ohne Login-Shell an.</li>
              <li>Klont das Repository nach <Code>/opt/unser-geheimnis</Code>.</li>
              <li>Fragt die Angaben fürs Impressum ab und erzeugt <Code>.env</Code> mit zufälligem <Code>APP_SECRET</Code> (nur für den Dienst lesbar, Rechte 600).</li>
              <li>Installiert Abhängigkeiten, legt die SQLite-Datenbank an und baut die App.</li>
              <li>Richtet einen gehärteten systemd-Dienst ein, der nur auf <Code>127.0.0.1</Code> lauscht.</li>
              <li>Optional: installiert Caddy als Reverse-Proxy mit automatischem HTTPS.</li>
              <li>Prüft, ob die App antwortet, und zeigt eine Zusammenfassung.</li>
            </ol>
            <P>Bereits vorhandene <Code>.env</Code>-Dateien und Daten werden nie überschrieben.</P>

            {/* Optionen */}
            <H2 id="optionen">Script-Optionen</H2>
            <Table
              head={["Option", "Bedeutung", "Standard"]}
              rows={[
                [<Code key="a">--domain</Code>, "Öffentliche Domain der Instanz", "fragt nach"],
                [<Code key="a">--proxy caddy|none</Code>, "Caddy mit HTTPS einrichten oder eigenen Proxy nutzen", "fragt nach"],
                [<Code key="a">--dir</Code>, "Installationsverzeichnis", <Code key="b">/opt/unser-geheimnis</Code>],
                [<Code key="a">--port</Code>, "Interner Port (nur localhost)", <Code key="b">3000</Code>],
                [<Code key="a">--branch</Code>, "Git-Branch", <Code key="b">main</Code>],
                [<Code key="a">--smtp-host</Code>, "SMTP-Server für E-Mail-Versand", "–"],
                [<Code key="a">--smtp-user / --smtp-pass</Code>, "SMTP-Zugangsdaten", "–"],
                [<Code key="a">--mail-from</Code>, "Absender der E-Mails", "Domain + SMTP-Benutzer"],
                [<Code key="a">--legal-name / --legal-email</Code>, "Impressum: Betreiber und Kontakt-E-Mail", "fragt nach"],
                [<Code key="a">--legal-address</Code>, "Impressum: Anschrift, Zeilen mit | getrennt", "fragt nach"],
                [<Code key="a">--legal-phone</Code>, "Impressum: Telefon", "optional"],
                [<Code key="a">-y</Code>, "Ohne Rückfragen (z. B. für Ansible / cloud-init)", "–"],
              ]}
            />
            <P>Jede Option gibt es auch als Umgebungsvariable mit Präfix <Code>UG_</Code>, zum Beispiel für eine automatisierte Installation:</P>
            <CodeBlock
              title="Unbeaufsichtigt"
              code={`sudo UG_DOMAIN=secrets.example.de UG_PROXY=caddy bash install.sh -y`}
            />

            {/* Reverse Proxy */}
            <H2 id="reverse-proxy">Reverse-Proxy &amp; HTTPS</H2>
            <P>
              HTTPS ist Pflicht: Browser stellen die Web Crypto API zum Verschlüsseln nur auf sicheren Seiten (HTTPS) bereit.
              Mit <Code>--proxy caddy</Code> passiert alles automatisch. Läuft auf dem Server schon nginx oder Apache, nutze{" "}
              <Code>--proxy none</Code> und eine der folgenden Konfigurationen.
            </P>
            <Note tone="warn" title="Wichtig: X-Forwarded-For setzen, nicht anhängen">
              Die Rate-Limits (Missbrauchsschutz) nutzen die Client-IP aus <Code>X-Forwarded-For</Code>. Der Proxy muss den Header mit der
              echten IP <strong>überschreiben</strong>. Wird er nur ergänzt, könnte ein Angreifer eine falsche IP mitschicken und die Limits umgehen.
              Caddy macht das standardmäßig richtig.
            </Note>
            <CodeBlock
              title="nginx — /etc/nginx/sites-available/unser-geheimnis"
              lang="nginx"
              code={`server {
    listen 443 ssl http2;
    server_name secrets.example.de;
    # ssl_certificate … (z. B. via certbot --nginx)

    client_max_body_size 30m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # überschreiben!
        proxy_set_header X-Forwarded-Proto https;
        access_log off;                                   # keine IP-Logs
    }
}`}
            />
            <CodeBlock
              title="Apache — VirtualHost (mod_proxy, mod_headers)"
              lang="apache"
              code={`<VirtualHost *:443>
    ServerName secrets.example.de
    # SSLEngine on … (z. B. via certbot --apache)

    ProxyPreserveHost On
    ProxyRequests Off
    # Vom Client gesendetes X-Forwarded-For verwerfen — mod_proxy setzt die echte IP
    RequestHeader unset X-Forwarded-For
    RequestHeader set X-Forwarded-Proto "https"
    LimitRequestBody 31457280

    ProxyPass        / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>`}
            />

            {/* E-Mail */}
            <H2 id="e-mail">E-Mail (Daten anfordern)</H2>
            <P>
              Teilen und Anfordern per Link funktionieren ohne E-Mail. Für den Versand von Anfragen per E-Mail (mit Bestätigungscode
              für den Absender) brauchst du einen SMTP-Zugang. Ohne SMTP lehnt der Server den E-Mail-Versand mit einem Hinweis ab; alles andere funktioniert normal.
            </P>
            <CodeBlock
              title="/opt/unser-geheimnis/.env"
              code={`SMTP_HOST=smtp.example.de
SMTP_PORT=587                 # 587 = STARTTLS (erzwungen), 465 = TLS
SMTP_USER=noreply@example.de
SMTP_PASS="dein-passwort"
MAIL_FROM="Secrets <noreply@example.de>"
MAIL_DAILY_LIMIT=300          # globale Obergrenze Einladungen/Tag`}
            />
            <CodeBlock title="Übernehmen" code={`sudo systemctl restart unser-geheimnis`} />
            <Note title="Zustellbarkeit">
              Richte für die Absender-Domain <strong>SPF, DKIM und DMARC</strong> ein. Microsoft 365 und Gmail verzögern oder filtern
              Mails von neuen, nicht authentifizierten Absendern. Bei vielen Empfängern bei Microsoft lohnt sich ein spezialisierter
              Versanddienst (z. B. Brevo oder Mailjet aus der EU).
            </Note>

            {/* Konfiguration */}
            <H2 id="konfiguration">Konfiguration (.env)</H2>
            <P>Alle Einstellungen liegen in <Code>/opt/unser-geheimnis/.env</Code>. Nach Änderungen: <Code>sudo systemctl restart unser-geheimnis</Code>.</P>
            <Table
              head={["Variable", "Beschreibung"]}
              rows={[
                [<Code key="a">NEXT_PUBLIC_SITE_URL</Code>, "Öffentliche Adresse inkl. https://. Wird beim Build eingebaut; nach Änderung install.sh update ausführen."],
                [<Code key="a">APP_SECRET</Code>, "Zufälliger Schlüssel (mind. 32 Zeichen) für Codes, Proof-of-Work und E-Mail-Hashes. Nicht ändern, solange Anfragen offen sind."],
                [<Code key="a">DATABASE_URL</Code>, "Pfad zur SQLite-Datenbank"],
                [<Code key="a">UPLOAD_DIR</Code>, "Ablage für verschlüsselte Dateien"],
                [<Code key="a">MAX_FILE_SIZE_MB</Code>, "Maximale Dateigröße (Standard 16)"],
                [<Code key="a">RATE_LIMIT_MAX</Code>, "Geheimnisse pro IP und Stunde (Standard 10)"],
                [<Code key="a">SMTP_* / MAIL_FROM</Code>, "E-Mail-Versand, siehe oben"],
                [<Code key="a">LEGAL_*</Code>, "Angaben fürs Impressum, siehe unten"],
              ]}
            />

            {/* Updates */}
            <H2 id="updates">Updates &amp; Backups</H2>
            <CodeBlock title="Auf die neueste Version aktualisieren" code={`sudo bash install.sh update`} />
            <P>
              Das Update sichert vorher die Datenbank (die letzten fünf Sicherungen bleiben in <Code>data/</Code>), übernimmt eigene
              Anpassungen am Code (z. B. Impressum), baut neu und startet den Dienst. Kollidieren Anpassungen mit dem Update,
              bricht es ab und legt einen Patch in <Code>data/</Code> ab.
            </P>
            <CodeBlock
              title="Backup (z. B. täglich per Cron)"
              code={`tar -czf /root/ug-backup-$(date +%F).tar.gz -C /opt/unser-geheimnis .env data`}
            />
            <P>
              Backups enthalten nur verschlüsselte Daten. Ohne die Links der Nutzer sind sie nicht lesbar. Da Geheimnisse nach
              maximal 48 Stunden ablaufen, ist vor allem die <Code>.env</Code> wichtig.
            </P>

            {/* Anpassen */}
            <H2 id="anpassen">Impressum, Datenschutz &amp; Branding</H2>
            <P>
              Die <strong className="text-text-primary">Angaben im Impressum</strong> stehen nicht im Code, sondern in der <Code>.env</Code>.
              Das Installscript fragt sie ab, ändern kannst du sie jederzeit. Danach genügt ein Neustart:
            </P>
            <CodeBlock
              title="/opt/unser-geheimnis/.env"
              code={`LEGAL_NAME='Muster GmbH'
LEGAL_ADDRESS='Musterstraße 1|12345 Musterstadt|Deutschland'   # Zeilen mit | trennen
LEGAL_EMAIL='impressum@example.de'
LEGAL_PHONE='+49 123 456789'                 # optional
LEGAL_REPRESENTATIVE='Max Mustermann'        # optional, z. B. Geschäftsführer
LEGAL_REGISTER='Amtsgericht München, HRB 12345'   # optional
LEGAL_VAT_ID='DE123456789'                   # optional`}
            />
            <CodeBlock title="Übernehmen" code={`sudo systemctl restart unser-geheimnis`} />
            <Note tone="warn" title="Datenschutzerklärung prüfen">
              Die Datenschutzerklärung beschreibt den Betrieb von unser-geheimnis.de, z. B. Hosting in Deutschland und den
              E-Mail-Dienstleister. Prüfe sie für deine Instanz und passe sie bei Bedarf an. Verantwortlicher ist automatisch der
              Betreiber aus dem Impressum.
            </Note>
            <Table
              head={["Datei", "Inhalt"]}
              rows={[
                [<Code key="a">src/app/datenschutz/page.tsx</Code>, "Datenschutzerklärung"],
                [<Code key="a">src/app/layout.tsx</Code>, "Seitentitel, Beschreibung, Open-Graph-Daten"],
                [<Code key="a">src/components/ui/Icons.tsx</Code>, "Logo / Wortmarke"],
                [<Code key="a">src/app/globals.css</Code>, "Farben (Design-Tokens)"],
              ]}
            />
            <P>Nach Änderungen an diesen Dateien <Code>sudo bash install.sh update</Code> ausführen. Deine Änderungen bleiben auch bei künftigen Updates erhalten.</P>

            {/* Manuell */}
            <H2 id="manuell">Manuelle Installation</H2>
            <P>Ohne Script, z. B. für andere Distributionen oder Container. Du brauchst Node.js ≥ 20 und git:</P>
            <CodeBlock
              title="Schritt für Schritt"
              code={`git clone ${REPO}.git /opt/unser-geheimnis
cd /opt/unser-geheimnis
cat > .env <<EOF
DATABASE_URL="file:/opt/unser-geheimnis/data/prod.db"
NEXT_PUBLIC_SITE_URL="https://secrets.example.de"
UPLOAD_DIR="/opt/unser-geheimnis/data/secrets"
APP_SECRET=$(openssl rand -hex 32)
LEGAL_NAME='Muster GmbH'
LEGAL_ADDRESS='Musterstraße 1|12345 Musterstadt|Deutschland'
LEGAL_EMAIL='impressum@example.de'
EOF
chmod 600 .env && mkdir -p data/secrets

npm ci
set -a && . ./.env && set +a
npx prisma generate && npx prisma db push
NODE_ENV=production npx next build

# Start (dauerhaft per systemd, siehe install.sh → write_service)
NODE_ENV=production npx next start -H 127.0.0.1 -p 3000`}
            />

            {/* Sicherheit */}
            <H2 id="sicherheit">Sicherheitshinweise</H2>
            <ul className="list-disc pl-5 space-y-2 text-text-secondary mb-4">
              <li><strong className="text-text-primary">Firewall:</strong> nur 22, 80 und 443 öffnen. Der App-Port bleibt auf localhost.</li>
              <li><strong className="text-text-primary">Keine Zugriffs-Logs mit IP-Adressen</strong> im Reverse-Proxy (DSGVO). Die Pfade enthalten zwar nie Schlüssel (die stehen nur im #-Fragment), trotzdem gilt: so wenig wie möglich protokollieren.</li>
              <li><strong className="text-text-primary">Updates</strong> regelmäßig einspielen, auch für das Betriebssystem (<Code>unattended-upgrades</Code>).</li>
              <li><strong className="text-text-primary">APP_SECRET</strong> geheim halten. Wer es kennt, kann Proof-of-Work-Aufgaben fälschen und die Pseudonymisierung von IPs und E-Mail-Adressen aufheben. Verschlüsselte Inhalte bleiben trotzdem unlesbar.</li>
              <li>Der Server sieht <strong className="text-text-primary">nie</strong> Klartext oder Schlüssel. Ein kompromittierter Server könnte allerdings manipulierten JavaScript-Code ausliefern. Schütze ihn deshalb wie jede andere sicherheitskritische Anwendung.</li>
            </ul>

            {/* Deinstallation */}
            <H2 id="deinstallation">Deinstallation</H2>
            <CodeBlock
              title="Alles entfernen"
              code={`sudo systemctl disable --now unser-geheimnis
sudo rm /etc/systemd/system/unser-geheimnis.service && sudo systemctl daemon-reload
sudo rm -rf /opt/unser-geheimnis          # löscht auch alle Daten!
sudo userdel geheimnis
# Optional: Block für die Domain aus /etc/caddy/Caddyfile entfernen`}
            />

            <div className="mt-16 rounded-2xl border border-border bg-bg-secondary p-6 text-center">
              <p className="text-text-primary font-semibold mb-2">Lieber nichts selbst betreiben?</p>
              <p className="text-text-secondary text-sm mb-4">Nutze einfach die gehostete Version: kostenlos, ohne Account, in Deutschland gehostet.</p>
              <Link href="/" className="inline-flex px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-xl transition-colors">
                Zu unser-geheimnis.de
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
