# CLAUDE.md — Projektprompt: unser-geheimnis.de

> **Dieses Dokument dient als vollständige Projektspezifikation und Entwicklungsanweisung.**
> Nutzbar als `CLAUDE.md` (Claude Code) und als Kontextdatei für Google Antigravity / Gemini Code Assist.

---

## 1. Projektvision

**unser-geheimnis.de** ist ein hochseriöser, moderner Webdienst zum **sicheren, verschlüsselten und DSGVO-konformen** Teilen von Zugangsdaten (Passwörter, API-Keys, Tokens, Notizen) und Dateien (bis 16 MB). Der Dienst folgt dem Prinzip: **„Erstellen → Link teilen → Empfänger öffnet → Geheimnis wird unwiderruflich gelöscht."**

**Kernprinzipien (NICHT VERHANDELBAR):**

1. **VERSCHLÜSSELT** — Ende-zu-Ende-Verschlüsselung (Zero-Knowledge-Architektur). Der Server kann Geheimnisse niemals im Klartext lesen.
2. **DSGVO-KONFORM** — Minimale Datenerhebung, vollständige Löschung ohne Wiederherstellbarkeit, kein Tracking, kein Analytics, transparente Datenschutzerklärung.
3. **SICHER** — Defense-in-Depth: Verschlüsselung im Browser, verschlüsselte Speicherung auf dem Server, sichere Löschmechanismen, Rate-Limiting, CSRF-Schutz, Content Security Policy.
4. **ADMIN-PROOF (ZERO TRUST)** — Selbst der Serveradministrator / Betreiber darf technisch NICHT in der Lage sein, Geheimnisse zu entschlüsseln oder einzusehen. Das ist kein Policy-Versprechen, sondern eine **technische Garantie**: Der Entschlüsselungsschlüssel existiert ausschließlich im URL-Fragment beim Nutzer, niemals auf dem Server, nicht in Logs, nicht in der Datenbank, nicht im RAM des Backends. Der Admin sieht nur verschlüsselte Blobs ohne jeden Wert.
5. **KEIN TRACKING** — Null Nutzerdaten. Kein Google Analytics, keine Cookies, keine Fingerprints, kein Session-Tracking, keine IP-Speicherung über Rate-Limiting hinaus (nur im RAM, nicht persistiert). Kein einziges externes Script oder Pixel. Der Dienst ist für den Betreiber eine Black Box — er weiß nicht, wer ihn nutzt, was geteilt wird, oder wie oft.
6. **SEO-OPTIMIERT** — Der Dienst muss organisch gut in Google ranken für Suchbegriffe wie „Passwort sicher teilen", „verschlüsselte Zugangsdaten senden", „DSGVO Passwort-Sharing" etc.

---

## 2. Architektur — Zero-Knowledge-Design

### 2.1 Verschlüsselungskonzept (KRITISCH)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (Ersteller)                                                │
│                                                                     │
│  1. Benutzer gibt Geheimnis ein (Text ODER Datei bis 16 MB)        │
│  2. Browser erzeugt zufälligen 256-bit AES-GCM Schlüssel           │
│  3. Browser verschlüsselt Geheimnis clientseitig mit Web Crypto API│
│  4. Nur das verschlüsselte Blob wird an den Server gesendet        │
│  5. Server speichert: { id, encryptedBlob, iv, expiresAt, type }   │
│  6. Server gibt zurück: unique_id                                   │
│  7. Browser baut Link: https://unser-geheimnis.de/s/unique_id#key  │
│     └── Der Schlüssel steht im URL-FRAGMENT (#), wird NIEMALS an   │
│         den Server gesendet (Browser-Standard: Fragments bleiben   │
│         lokal)                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (Empfänger)                                                │
│                                                                     │
│  1. Empfänger öffnet Link                                           │
│  2. Browser liest Fragment (#key) → extrahiert Entschlüsselungskey  │
│  3. Browser fordert verschlüsseltes Blob vom Server an (via ID)     │
│  4. Browser entschlüsselt clientseitig mit AES-GCM                  │
│  5. Klartext wird AUSSCHLIESSLICH im Browser angezeigt              │
│  6. Nach dem Abruf: Server löscht das Geheimnis sofort              │
│     (One-Time-View) ODER nach Ablauf der gewählten TTL              │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementierungsdetails Verschlüsselung:**

- **Algorithmus:** AES-256-GCM (via `window.crypto.subtle`)
- **Schlüsselerzeugung:** `crypto.subtle.generateKey()` mit 256-bit
- **IV (Initialization Vector):** 12 Byte, zufällig generiert pro Geheimnis, wird zusammen mit dem Ciphertext gespeichert (ist kein Sicherheitsrisiko)
- **Schlüsselexport:** `crypto.subtle.exportKey('raw', key)` → Base64url-kodiert → im URL-Fragment
- **Kein serverseitiger Zugriff auf den Schlüssel — zu keinem Zeitpunkt.**

### 2.2 Tech-Stack

| Schicht       | Technologie                    | Begründung                                         |
|---------------|--------------------------------|-----------------------------------------------------|
| **Frontend**  | React 18+ (Vite) + TypeScript  | SPA, schnelles HMR, Tree-Shaking                   |
| **Styling**   | Tailwind CSS 3+ + Framer Motion| Utility-first + professionelle Animationen          |
| **Backend**   | Node.js + Express ODER Fastify | Leichtgewichtig, async-first                        |
| **Datenbank** | SQLite (besser: PostgreSQL)    | SQLite für MVP, Postgres für Produktion             |
| **Dateispeicher** | Lokales Filesystem (verschlüsselt) | Verschlüsselte Blobs auf Disk, Pfad in DB     |
| **Cron/Scheduler** | node-cron ODER pg_cron    | Automatische Löschung abgelaufener Geheimnisse      |
| **Reverse Proxy** | Nginx oder Caddy           | TLS-Terminierung, Rate-Limiting, Security Headers   |

**Alternativ (Fullstack-Monolith):** Next.js 14+ mit App Router + API Routes — reduziert Komplexität, SSR für Landing Page / SEO, API Routes für Backend-Logik. Empfohlen für schnelleres MVP.

### 2.3 Projektstruktur

```
unser-geheimnis/
├── CLAUDE.md                    ← Dieses Dokument
├── .env.example                 ← Umgebungsvariablen-Vorlage
├── docker-compose.yml           ← Entwicklung + Produktion
├── package.json
│
├── prisma/                      ← Datenbankschema (Prisma ORM)
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── app/                     ← Next.js App Router ODER separates Frontend
│   │   ├── layout.tsx           ← Root Layout (Fonts, Metadata, Theme)
│   │   ├── page.tsx             ← Landing Page / Geheimnis-Ersteller
│   │   ├── s/[id]/page.tsx      ← Geheimnis-Anzeige (Empfänger-Seite)
│   │   ├── datenschutz/page.tsx ← DSGVO-Datenschutzerklärung
│   │   ├── impressum/page.tsx   ← Impressum (gesetzlich Pflicht in DE)
│   │   └── api/
│   │       ├── secrets/route.ts ← POST: Geheimnis speichern
│   │       ├── secrets/[id]/route.ts ← GET: Abrufen + Löschen, DELETE
│   │       └── health/route.ts  ← Health Check
│   │
│   ├── components/
│   │   ├── ui/                  ← Basis-UI-Komponenten (Button, Input, Card, Dialog)
│   │   ├── SecretCreator.tsx    ← Hauptformular: Text + Datei + TTL-Auswahl
│   │   ├── SecretRevealer.tsx   ← Empfänger: Entschlüsselung + Anzeige mit Animation
│   │   ├── FileUpload.tsx       ← Drag & Drop Datei-Upload (max 16 MB)
│   │   ├── ExpirySelector.tsx   ← TTL-Auswahl: 1, 2, 4, 8, 12, 24, 48 Stunden
│   │   ├── LinkDisplay.tsx      ← Generierter Link mit Kopieren-Button
│   │   ├── RevealAnimation.tsx  ← 🔥 Aufwändige Öffnungs-Animation
│   │   ├── DownloadAnimation.tsx← 🔥 Coole Download-Animation für Dateien
│   │   ├── CountdownTimer.tsx   ← Verbleibende Zeit bis Löschung
│   │   └── Footer.tsx           ← Impressum, Datenschutz, Branding
│   │
│   ├── lib/
│   │   ├── crypto.ts            ← ⚡ ALLE clientseitigen Crypto-Funktionen
│   │   ├── api.ts               ← API-Client (fetch-Wrapper)
│   │   ├── validation.ts        ← Zod-Schemas für Input-Validierung
│   │   └── constants.ts         ← TTL-Optionen, Max-Dateigröße etc.
│   │
│   ├── server/
│   │   ├── db.ts                ← Prisma Client Singleton
│   │   ├── storage.ts           ← Datei-Speicherung (verschlüsselte Blobs)
│   │   ├── cleanup.ts           ← ⚡ Scheduler: Abgelaufene Geheimnisse LÖSCHEN
│   │   └── middleware.ts        ← Rate-Limiting, CORS, Helmet, CSRF
│   │
│   └── types/
│       └── index.ts             ← Shared TypeScript Types
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png             ← Open Graph Vorschaubild
│   └── fonts/                   ← Selbst-gehostete Fonts (DSGVO: kein Google Fonts CDN!)
│
└── tests/
    ├── crypto.test.ts           ← Unit-Tests für Verschlüsselung
    ├── api.test.ts              ← API-Integrationstests
    └── cleanup.test.ts          ← Tests für automatische Löschung
```

---

## 3. Datenbankschema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // oder "sqlite" für MVP
  url      = env("DATABASE_URL")
}

model Secret {
  id             String   @id @default(cuid())       // Öffentliche ID (in URL)
  encryptedData  Bytes                                 // Verschlüsselter Text/Datei-Blob
  iv             Bytes                                 // Initialization Vector (12 Bytes)
  type           SecretType                             // TEXT oder FILE
  fileName       String?                               // Originaler Dateiname (verschlüsselt? → optional)
  fileSize       Int?                                  // Dateigröße in Bytes
  mimeType       String?                               // MIME-Type für korrekten Download
  expiresAt      DateTime                              // Ablaufzeitpunkt (UTC)
  burnAfterRead  Boolean  @default(true)               // Sofort nach Lesen löschen?
  readCount      Int      @default(0)                  // Wie oft abgerufen (max 1 bei burnAfterRead)
  createdAt      DateTime @default(now())
  
  // KEIN Bezug zu Benutzer/IP → DSGVO-Minimierung
  // KEINE IP-Adresse, KEIN User-Agent, KEINE Cookies
  
  @@index([expiresAt])  // Index für schnelle Cleanup-Abfragen
}

enum SecretType {
  TEXT
  FILE
}
```

**DSGVO-Hinweis:** Es werden KEINE personenbezogenen Daten gespeichert — keine IP, keine E-Mails, kein Tracking. Das verschlüsselte Blob ist für den Server nicht lesbar und daher kein „personenbezogenes Datum" im DSGVO-Sinne (der Server hat keinen Schlüssel).

---

## 4. API-Endpunkte

### `POST /api/secrets`

Erstellt ein neues Geheimnis.

```typescript
// Request Body (multipart/form-data ODER JSON):
{
  encryptedData: string;   // Base64-kodierter AES-256-GCM Ciphertext
  iv: string;              // Base64-kodierter IV
  type: "TEXT" | "FILE";
  fileName?: string;       // Original-Dateiname (kann auch clientseitig verschlüsselt werden)
  fileSize?: number;
  mimeType?: string;
  expiresIn: 1 | 2 | 4 | 8 | 12 | 24 | 48; // Stunden
  burnAfterRead?: boolean; // Default: true
}

// Response:
{
  id: string;              // z.B. "clx7abc123..."
  expiresAt: string;       // ISO 8601 UTC Timestamp
}

// → Frontend baut daraus: https://unser-geheimnis.de/s/{id}#{base64url_key}
```

**Validierung & Limits:**
- `encryptedData`: Max 22 MB Base64 (≈16 MB Rohdaten)
- `expiresIn`: Strikt nur erlaubte Werte: `[1, 2, 4, 8, 12, 24, 48]`
- Rate-Limit: Max 10 Geheimnisse pro IP pro Stunde (konfigurierbar)

### `GET /api/secrets/:id`

Ruft ein verschlüsseltes Geheimnis ab.

```typescript
// Response:
{
  encryptedData: string;
  iv: string;
  type: "TEXT" | "FILE";
  fileName?: string;
  mimeType?: string;
  expiresAt: string;
}

// Seiteneffekt: Wenn burnAfterRead=true → Sofort löschen nach Response
// Wenn nicht: readCount++ (optionales Feature)
```

**Fehlerbehandlung:**
- `404` → Geheimnis existiert nicht oder wurde bereits gelöscht
- `410 Gone` → Geheimnis war vorhanden, ist aber abgelaufen/gelöscht
- Bewusst vager Fehlertext: Angreifer soll nicht unterscheiden können, ob ID nie existierte oder gelöscht wurde. → Immer `404` mit gleicher Nachricht.

### `DELETE /api/secrets/:id` (optional)

Ermöglicht dem Ersteller, ein Geheimnis vorzeitig zu löschen (braucht ein Delete-Token, das nur der Ersteller beim Erstellen erhält).

---

## 5. Clientseitige Verschlüsselung (lib/crypto.ts)

```typescript
// Diese Datei ist das HERZ der Sicherheit — besondere Sorgfalt!

// === VERSCHLÜSSELN (Ersteller-Browser) ===

export async function encryptSecret(plaintext: string | ArrayBuffer): Promise<{
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  key: CryptoKey;
}> {
  // 1. Schlüssel generieren
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable → wir müssen ihn exportieren für URL
    ['encrypt', 'decrypt']
  );
  
  // 2. IV generieren
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 3. Daten vorbereiten
  const data = typeof plaintext === 'string' 
    ? new TextEncoder().encode(plaintext) 
    : plaintext;
  
  // 4. Verschlüsseln
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return { encryptedData, iv, key };
}

// === SCHLÜSSEL FÜR URL EXPORTIEREN ===

export async function exportKeyToBase64url(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64url(raw);
}

// === ENTSCHLÜSSELN (Empfänger-Browser) ===

export async function decryptSecret(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  base64urlKey: string
): Promise<ArrayBuffer> {
  // 1. Schlüssel aus URL-Fragment importieren
  const keyData = base64urlToArrayBuffer(base64urlKey);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  
  // 2. Entschlüsseln
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
}

// === HILFSFUNKTIONEN ===

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
```

---

## 6. Automatische Löschung (DSGVO-KONFORM — KRITISCH)

### 6.1 Cleanup-Scheduler

```typescript
// server/cleanup.ts — Läuft als Cronjob oder In-Process-Scheduler

import cron from 'node-cron';
import { prisma } from './db';
import { unlinkSync } from 'fs';

// Alle 60 Sekunden: Abgelaufene Geheimnisse unwiderruflich löschen
cron.schedule('* * * * *', async () => {
  const expired = await prisma.secret.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true, type: true }
  });
  
  for (const secret of expired) {
    // 1. Wenn FILE: Datei von Disk löschen
    if (secret.type === 'FILE') {
      const filePath = getSecretFilePath(secret.id);
      try {
        // Datei überschreiben vor dem Löschen (Anti-Recovery)
        secureDelete(filePath);
      } catch {}
    }
    
    // 2. DB-Eintrag löschen (CASCADE)
    await prisma.secret.delete({ where: { id: secret.id } });
  }
  
  if (expired.length > 0) {
    console.log(`[Cleanup] ${expired.length} abgelaufene Geheimnisse gelöscht.`);
  }
});
```

### 6.2 Sichere Löschung (Nicht-Wiederherstellbar)

```typescript
// Datei vor dem Löschen mit Zufallsdaten überschreiben
function secureDelete(filePath: string): void {
  const stats = statSync(filePath);
  const randomData = crypto.randomBytes(stats.size);
  writeFileSync(filePath, randomData);  // Überschreiben
  unlinkSync(filePath);                 // Dann löschen
}
```

**Zusätzliche Empfehlungen für Produktionsbetrieb:**
- Datenbank auf einer verschlüsselten Partition (LUKS) betreiben
- SSD TRIM aktivieren (hilft bei SSD-Löschung)
- DB-WAL und Backup-Logs ebenfalls regelmäßig purgen
- Kein automatisches DB-Backup (widerspricht dem Löschprinzip) — oder Backups ebenso mit TTL versehen

---

## 7. Frontend-Design & UX

### 7.1 Design-System

**Ästhetik:** Hochseriös, vertrauenswürdig, deutsch/europäisch, modern — inspiriert von Banking-UIs und Privacy-Tools. KEIN verspieltes Startup-Feeling. Clean, mit bewussten Akzenten.

**Farbschema (CSS-Variablen):**
```css
:root {
  /* Primär: Tiefes, vertrauenswürdiges Blau-Schwarz */
  --color-bg-primary: #0a0e1a;
  --color-bg-secondary: #111827;
  --color-bg-card: #1a2035;
  
  /* Akzent: Kühles Teal/Cyan — steht für Verschlüsselung/Sicherheit */
  --color-accent: #06d6a0;
  --color-accent-hover: #05c896;
  --color-accent-glow: rgba(6, 214, 160, 0.15);
  
  /* Text */
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #475569;
  
  /* Danger / Warnung (TTL, Löschung) */
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  
  /* Borders & Dividers */
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-focus: rgba(6, 214, 160, 0.4);
}
```

**Typografie:**
- Headlines: `"Instrument Serif"` oder `"Fraunces"` (serös, unique, selbst gehostet)
- Body: `"Satoshi"` oder `"General Sans"` (modern, lesbar, KEINE Google-Fonts-CDN-Einbindung!)
- Monospace (für Passwörter/Keys): `"JetBrains Mono"` oder `"Berkeley Mono"`
- **DSGVO: Alle Fonts LOKAL hosten, KEIN Google Fonts CDN!**

### 7.2 Seitenstruktur

#### Landing Page / Ersteller-Ansicht (`/`)

```
┌──────────────────────────────────────────────┐
│  🔒 unser-geheimnis.de                 [DE]  │
│                                               │
│     Teile sensible Daten.                     │
│     Verschlüsselt. Einmalig. Spurlos.         │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  [📝 Text]    [📎 Datei]               │  │  ← Tab-Umschalter
│  │                                         │  │
│  │  ┌───────────────────────────────────┐  │  │
│  │  │ Passwort, API-Key, Zugangsdaten   │  │  │  ← Textarea (monospace)
│  │  │ oder vertrauliche Nachricht...     │  │  │
│  │  │                                   │  │  │
│  │  └───────────────────────────────────┘  │  │
│  │                                         │  │
│  │  Gültigkeitsdauer:                      │  │
│  │  [1h] [2h] [4h] [8h] [12h] [24h] [48h] │  │  ← Pill-Buttons
│  │                                         │  │
│  │  ☑ Nach dem Lesen sofort löschen        │  │  ← Checkbox (default: an)
│  │                                         │  │
│  │  [ 🔐 Geheimnis verschlüsseln & Link   │  │
│  │       erstellen                        ]│  │  ← Primary CTA
│  └─────────────────────────────────────────┘  │
│                                               │
│  ── So funktioniert's ──                      │
│  1. Eingeben → 2. Verschlüsseln → 3. Link    │
│     teilen → 4. Empfänger öffnet → 5. Weg.   │
│                                               │
│  🛡️ Zero-Knowledge · Ende-zu-Ende · Open?     │
│                                               │
│  [Datenschutz]  [Impressum]  [GitHub?]        │
└──────────────────────────────────────────────┘
```

#### Link-Ergebnis (nach Erstellung)

```
┌──────────────────────────────────────────────┐
│                                               │
│  ✅ Dein Geheimnis ist verschlüsselt.         │
│                                               │
│  ┌───────────────────────────────────────┐    │
│  │ https://unser-geheimnis.de/s/abc#k3y  │ 📋 │ ← Kopieren-Button
│  └───────────────────────────────────────┘    │
│                                               │
│  ⏱ Verfällt in: 4 Stunden (16:32 Uhr)        │
│  🔥 Wird nach dem Lesen sofort gelöscht       │
│                                               │
│  ⚠️ Speichere diesen Link JETZT — er wird     │
│     nicht erneut angezeigt.                   │
│                                               │
│  [🗑 Geheimnis jetzt löschen]                 │ ← Delete-Button (optional)
│  [🔐 Weiteres Geheimnis erstellen]            │
└──────────────────────────────────────────────┘
```

#### Empfänger-Ansicht (`/s/:id#key`)

```
┌──────────────────────────────────────────────┐
│  🔒 unser-geheimnis.de                       │
│                                               │
│  Jemand hat dir ein Geheimnis geschickt.      │
│                                               │
│  [ 🔓 Geheimnis entschlüsseln & anzeigen ]   │ ← Button (bewusster Klick)
│                                               │
│  ⚠️ Dieses Geheimnis kann nur EINMAL          │
│     angesehen werden.                         │
│                                               │
│                                               │
│  ─── NACH DEM KLICK: ───                      │
│                                               │
│  🎬 ANIMATION: Aufwändige "Enthüllungs"-      │
│     Animation (siehe 7.3)                     │
│                                               │
│  ┌───────────────────────────────────────┐    │
│  │  [Entschlüsselter Inhalt]             │ 📋 │
│  └───────────────────────────────────────┘    │
│                                               │
│  Bei Dateien: [⬇️ Datei herunterladen]        │
│  mit Download-Animation                       │
│                                               │
│  🔥 Dieses Geheimnis wurde unwiderruflich     │
│     gelöscht.                                 │
└──────────────────────────────────────────────┘
```

### 7.3 Animationen (WICHTIG — soll beeindrucken!)

Verwende **Framer Motion** (React) für alle Animationen. Die Animationen sollen hochwertig, flüssig und seriös wirken — NICHT billig oder übertrieben.

#### Animation 1: Geheimnis-Enthüllung (RevealAnimation)

**Konzept: „Tresor-Öffnung"**
1. **Phase 1 (0.0s–0.8s):** Ein stilisierter Tresor/Schloss-Icon pulsiert subtil. Feine Partikel (wie digitaler Staub) bewegen sich zum Zentrum hin. Text: „Entschlüssle…"
2. **Phase 2 (0.8s–1.5s):** Das Schloss „entriegelt" sich — ein satisfying Unlock-Effekt mit kurzem Glow-Pulse. Der Hintergrund dimmt leicht.
3. **Phase 3 (1.5s–2.5s):** Eine Card fährt smooth von unten/Mitte ein (`spring`-Animation), leichter Glasmorphism-Blur löst sich auf, der entschlüsselte Text erscheint mit einem Typewriter-Effekt (Zeichen für Zeichen) oder einem eleganten Fade-In.
4. **Phase 4:** Unterhalb: subtile rote Hinweismeldung blendet ein: „Dieses Geheimnis wurde gelöscht."

```tsx
// Animations-Sequenz mit Framer Motion Pseudocode:
const revealSequence = {
  lock: { scale: [1, 1.1, 1], transition: { duration: 0.8 } },
  unlock: { rotateY: 180, opacity: 0, transition: { duration: 0.7 } },
  cardEntry: { 
    y: [50, 0], opacity: [0, 1], 
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  },
  textReveal: { /* Typewriter oder staggered character animation */ },
  deleteNotice: { opacity: [0, 1], y: [10, 0], transition: { delay: 1.0 } }
};
```

#### Animation 2: Datei-Download (DownloadAnimation)

**Konzept: „Sicherer Transfer"**
1. Ein animierter Fortschrittsbalken mit Encryption-Muster (sich bewegende Hexadezimal-Zeichen oder ein Matrix-ähnlicher Effekt, aber DEZENT und seriös)
2. Ein Datei-Icon, das sich visuell „entschlüsselt" — z.B. von einem verschwommenen/verpixelten Zustand zu klar
3. Ein zufriedenstellender „Complete"-Checkmark mit weichem Glow
4. Danach automatischer Download-Trigger im Browser

#### Animation 3: Micro-Interactions

- **Pill-Buttons (TTL):** Smooth slide-Highlight zwischen Optionen (wie iOS Segmented Control)
- **Kopieren-Button:** Kurzes Tooltip „Kopiert!" mit Confetti-Micro-Animation oder Checkmark-Morph
- **Textarea/Datei-Tab:** Smooth Crossfade zwischen Text- und Datei-Modus
- **Countdown-Timer:** Pulsierender Punkt neben der Zeitanzeige, sanftes Ticking

### 7.4 Responsive Design

- **Mobile-First:** Formular muss auf 360px Breite perfekt funktionieren
- **Touch-optimiert:** Ausreichend große Tap-Targets (min 44px)
- **Datei-Upload auf Mobile:** Kamera + Datei-Auswahl kombiniert
- **Kein Horizontal-Scroll — niemals**

---

## 8. Sicherheitsmaßnahmen

### 8.1 Server-Sicherheit

```typescript
// middleware.ts

// 1. Helmet — Security Headers
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],      // Kein inline JS, kein CDN
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind braucht inline
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"], // Kein iFrame-Embedding
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'no-referrer' }  // DSGVO: Keine Referrer-Leaks
}));

// 2. Rate Limiting
import rateLimit from 'express-rate-limit';
app.use('/api/secrets', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 10,                   // Max 10 Erstellungen pro IP
  standardHeaders: true,
  legacyHeaders: false,
  // IP wird NUR für Rate-Limiting im RAM gehalten, NICHT geloggt
}));

// 3. CORS — nur eigene Domain
app.use(cors({ origin: 'https://unser-geheimnis.de' }));

// 4. Body-Parser Limit
app.use(express.json({ limit: '22mb' })); // 16MB Datei + Base64-Overhead
```

### 8.2 DSGVO-Checkliste

- [ ] **Kein Google Analytics, kein Tracking, keine Cookies** (außer ggf. technisch notwendige Session-Cookies)
- [ ] **Kein Google Fonts CDN** → Fonts selbst hosten
- [ ] **Keine externen Ressourcen** die Daten an Dritte übermitteln
- [ ] **Datenschutzerklärung** (`/datenschutz`) mit:
  - Verantwortliche Stelle (Name, Adresse, Kontakt)
  - Beschreibung der Verarbeitung (Zero-Knowledge, keine personenbezogenen Daten)
  - Speicherdauer (max 48h, dann unwiderruflich gelöscht)
  - Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
  - Keine Weitergabe an Dritte
  - Rechte der Betroffenen (Auskunft, Löschung — wobei technisch keine personenbezogenen Daten vorliegen)
- [ ] **Impressum** (`/impressum`) — Pflicht nach §5 TMG / DDG für DE
- [ ] **Kein Server-Logging von Request Bodies** — nur Status-Codes und Timestamps
- [ ] **IP-Adressen:** Wenn überhaupt geloggt, dann max 7 Tage und gekürzt (letztes Oktett entfernt)
- [ ] **Verschlüsselte Übertragung:** TLS 1.2+ erzwungen (HSTS)
- [ ] **Cookie-Banner:** Wahrscheinlich NICHT nötig (keine Cookies, kein Tracking), aber prüfen
- [ ] **Auftragsverarbeitung:** Wenn Hosting bei einem Dienstleister → AVV abschließen

### 8.3 Zusätzliche Sicherheitsfeatures

- **Passwortschutz (Optional):** Ersteller kann zusätzlich ein Passwort setzen → wird als zusätzlicher Key-Derivation-Input verwendet (PBKDF2 oder Argon2 im Browser)
- **Maximale Abrufanzahl:** Statt nur burn-after-read auch z.B. „max 3x abrufbar"
- **Integrity Check:** HMAC über den verschlüsselten Blob → Server prüft Integrität
- **Anti-Bruteforce:** IDs sind CUIDs (25+ Zeichen, nicht erratbar) — kein numerischer Zähler
- **No-Cache Headers:** `Cache-Control: no-store, no-cache` auf allen API-Antworten

---

## 9. Eigene Ideen & Bonus-Features

### 9.1 „Geheimnis brennt" — Visuelles Feedback

Wenn ein Geheimnis nach dem Lesen gelöscht wird, zeige eine subtile „Verbrennungs"-Animation: Der Text/die Card löst sich in Partikel auf oder verbrennt visuell von den Rändern her. Seriös umgesetzt (keine Comic-Flammen), eher wie Papier das dezent zu Asche wird.

### 9.2 QR-Code-Generierung

Nach Erstellung: Neben dem Link auch einen QR-Code anzeigen, der den vollständigen Link inkl. Fragment enthält. Praktisch für das Teilen zwischen Geräten (z.B. Link am PC erstellt, QR mit Handy scannen und an Kollegen weiterleiten).

### 9.3 Benachrichtigung bei Abruf (Optional, Privacy-bewusst)

Ersteller kann optional eine E-Mail-Adresse angeben, die eine Benachrichtigung erhält, wenn das Geheimnis abgerufen wird. ACHTUNG DSGVO: E-Mail muss nach Benachrichtigung sofort gelöscht werden. Alternativ: Webhook-URL statt E-Mail (für technische Nutzer).

### 9.4 CLI-Tool / API-Dokumentation

Für Power-User: Ein simples CLI-Tool oder cURL-Beispiele, um Geheimnisse programmatisch zu erstellen.

```bash
# Beispiel:
echo "mein-passwort" | npx unser-geheimnis create --ttl 4h
# → https://unser-geheimnis.de/s/abc123#key456
```

### 9.5 Statusseite

Einfache Statusseite: „Dienst verfügbar", Uptime, aktuelle Anzahl gespeicherter Geheimnisse (anonymisiert, nur Zahl).

### 9.6 Dark/Light Mode Toggle

Default: Dark Mode (wirkt seriöser und „geheimer"). Optional: Light Mode für hellere Arbeitsumgebungen. System-Preference respektieren.

---

## 10. Admin-Proof Hardening (ZERO TRUST gegenüber dem eigenen Server)

Dieses Kapitel beschreibt die technischen Maßnahmen, die sicherstellen, dass **selbst der Serveradministrator / Betreiber** keinerlei Zugriff auf Klartext-Geheimnisse hat. Dies ist keine Policy, sondern eine **architektonische Garantie**.

### 10.1 Was der Admin sieht (= Nichts Brauchbares)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Was in der Datenbank steht:                                        │
│                                                                     │
│  id:             "clx7f9k2a0001..."                                 │
│  encryptedData:  0x8A3F...2B1C (binärer Blob — NICHT entschlüsselbar│
│                  ohne den Schlüssel, der NUR im URL-Fragment lebt)   │
│  iv:             0x1A2B3C... (12 Bytes, kein Sicherheitswert allein)│
│  type:           "TEXT" oder "FILE"                                  │
│  expiresAt:      "2026-03-27T14:00:00Z"                             │
│                                                                     │
│  Was NICHT in der DB steht:                                         │
│  ❌ Entschlüsselungsschlüssel                                       │
│  ❌ Klartext                                                         │
│  ❌ IP-Adressen                                                      │
│  ❌ Benutzerinformationen                                            │
│  ❌ Wer das Geheimnis erstellt hat                                   │
│  ❌ Wer es abgerufen hat                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Technische Garantien

```typescript
// CHECKLISTE — jeder Punkt ist PFLICHT:

// 1. Schlüssel NIE auf dem Server
//    → Der Schlüssel existiert NUR im URL-Fragment (#)
//    → Browser-Standard: Fragments werden NICHT an den Server gesendet
//    → Der Schlüssel taucht in keinem Access-Log, keinem Request-Body,
//      keinem Cookie, keinem Header auf

// 2. Kein Server-Logging von Geheimnissen
//    → Request-Bodies werden NICHT geloggt
//    → Nginx/Caddy: access_log nur Status-Code + Timestamp, KEIN $request_body
//    → Kein Debug-Logging das encryptedData ausgibt
//    → Error-Logging: Nur Stack-Traces, keine Payloads

// 3. Kein Backup der Geheimnisse
//    → DB-Backups: NUR Schema + Konfiguration, KEINE Tabellendaten von "Secret"
//    → Oder: Gar kein automatisches DB-Backup (empfohlen)
//    → Wenn Backup-Tool: Secret-Tabelle explizit excluden

// 4. RAM-Hygiene
//    → encryptedData wird im Backend nie in eine Variable geschrieben
//      die länger lebt als der Request-Handler
//    → Kein Caching von Geheimnissen (kein Redis, kein In-Memory-Cache)
//    → Stream-basierte Verarbeitung für große Dateien (kein vollständiges
//      Laden in den RAM)

// 5. Festplatte
//    → Verschlüsselte Disk/Partition (LUKS) für /data/secrets/
//    → Secure-Delete: Datei mit Zufallsdaten überschreiben VOR unlink()
//    → SSD-TRIM beachten (echtes Löschen auf SSDs ist komplex)

// 6. Kein Admin-Panel für Geheimnisse
//    → Es gibt KEINEN Admin-Endpunkt zum Auflisten oder Lesen von Geheimnissen
//    → Kein /admin/secrets, kein Dashboard mit Geheimnis-Inhalten
//    → Admin-Zugang (falls vorhanden): nur Statistiken (Anzahl, Speicherverbrauch)
//      und Systemstatus — NIE Inhalte
```

### 10.3 Nginx/Caddy Logging-Konfiguration (PFLICHT)

```nginx
# Nginx: KEIN Request-Body in Logs, gekürzte IPs
log_format privacy '$remote_addr_anonymized - [$time_local] '
                   '"$request_method $uri" $status $body_bytes_sent';

# IP-Anonymisierung: Letztes Oktett durch 0 ersetzen
# Oder besser: Access-Log komplett deaktivieren
access_log off;

# Error-Log: Nur Fehler, keine Details
error_log /var/log/nginx/error.log error;
```

```
# Caddy: Minimales Logging
{
    log {
        level ERROR
        # Kein Access-Log
    }
}
```

### 10.4 Vertrauenserklärung auf der Website

Auf der Landing Page und/oder Datenschutzseite soll ein **„Warum du uns vertrauen kannst"**-Abschnitt stehen, der das Zero-Knowledge-Prinzip für Laien verständlich erklärt:

> **Selbst wir können dein Geheimnis nicht lesen.**
> Der Schlüssel zu deinen Daten verlässt nie deinen Browser. Er wird ausschließlich im Link gespeichert, den du teilst — nicht auf unserem Server. Wir speichern nur einen verschlüsselten Datensatz, der für uns genauso unlesbar ist wie für jeden anderen ohne den Link. Kein Admin, kein Hacker, kein Gericht kann den Inhalt entschlüsseln, weil der Schlüssel technisch nie bei uns ankommt.

---

## 11. SEO-Optimierung

### 11.1 Technisches SEO (PFLICHT)

```typescript
// Next.js Metadata (layout.tsx / page.tsx)
export const metadata: Metadata = {
  title: 'unser-geheimnis.de — Passwörter & Zugangsdaten sicher teilen',
  description: 'Teile Passwörter, API-Keys und Dateien verschlüsselt und DSGVO-konform. Ende-zu-Ende-Verschlüsselung, automatische Löschung, kein Tracking. Made in Germany.',
  keywords: [
    'Passwort sicher teilen',
    'Zugangsdaten verschlüsselt senden',
    'DSGVO Passwort-Sharing',
    'sichere Datenübertragung',
    'One-Time Secret deutsch',
    'verschlüsselter Link',
    'Passwort per Link teilen',
    'Dateien verschlüsselt teilen',
    'Zero Knowledge Verschlüsselung',
    'IT-Sicherheit Zugangsdaten',
  ],
  alternates: {
    canonical: 'https://unser-geheimnis.de',
  },
  openGraph: {
    title: 'unser-geheimnis.de — Geheimnisse sicher teilen',
    description: 'Ende-zu-Ende verschlüsselt. Automatische Löschung. DSGVO-konform. Kein Tracking.',
    url: 'https://unser-geheimnis.de',
    siteName: 'unser-geheimnis.de',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Passwörter sicher teilen — unser-geheimnis.de',
    description: 'Verschlüsselt. Einmalig. Spurlos.',
  },
  robots: {
    index: true,
    follow: true,
    // WICHTIG: /s/ Seiten NICHT indexieren (sind Geheimnisse!)
  },
};
```

### 11.2 robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /s/          # Geheimnis-Links NICHT crawlen!
Disallow: /api/        # API-Endpunkte nicht crawlen

Sitemap: https://unser-geheimnis.de/sitemap.xml
```

### 11.3 Sitemap

```xml
<!-- public/sitemap.xml (statisch, da dynamische Seiten geheim sind) -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://unser-geheimnis.de/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://unser-geheimnis.de/datenschutz</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://unser-geheimnis.de/impressum</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://unser-geheimnis.de/so-funktionierts</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 11.4 Strukturierte Daten (JSON-LD)

```typescript
// In layout.tsx oder page.tsx einbinden:
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': 'unser-geheimnis.de',
  'url': 'https://unser-geheimnis.de',
  'description': 'Sicherer Webdienst zum verschlüsselten Teilen von Passwörtern, Zugangsdaten und Dateien. DSGVO-konform mit automatischer Löschung.',
  'applicationCategory': 'SecurityApplication',
  'operatingSystem': 'Web',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'EUR',
  },
  'provider': {
    '@type': 'Organization',
    'name': 'Vetter-IT',  // Anpassen an tatsächlichen Betreiber
    'url': 'https://unser-geheimnis.de',
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'DE',
      'addressRegion': 'Bayern',
    }
  },
  'featureList': [
    'Ende-zu-Ende-Verschlüsselung',
    'Zero-Knowledge-Architektur',
    'DSGVO-konform',
    'Automatische Löschung',
    'Datei-Upload bis 16 MB',
    'Kein Tracking',
  ],
};

// → <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
```

### 11.5 SEO-Content-Seiten (empfohlen für Ranking)

Zusätzliche statische Seiten für Long-Tail-Keywords:

| Route                    | Inhalt                                                    | Ziel-Keywords                              |
|--------------------------|-----------------------------------------------------------|--------------------------------------------|
| `/so-funktionierts`      | Ausführliche Erklärung mit Grafiken: Wie funktioniert die Verschlüsselung? | „wie Passwort sicher verschicken"          |
| `/fuer-unternehmen`      | Einsatzszenarien für Firmen, IT-Abteilungen, MSPs         | „Passwort-Sharing Unternehmen DSGVO"       |
| `/vergleich`             | Vergleichstabelle: unser-geheimnis.de vs. OneTimeSecret vs. PrivateBin | „OneTimeSecret Alternative deutsch"        |
| `/blog` (optional)       | Artikel zu IT-Sicherheit, Passwort-Hygiene, DSGVO-Tipps   | Long-Tail Content-Marketing                |

### 11.6 Performance-SEO (Core Web Vitals)

```
PFLICHT für gutes Google-Ranking:

- LCP (Largest Contentful Paint): < 2.5s
  → SSR/SSG für Landing Page (Next.js default)
  → Kritisches CSS inlinen
  → Fonts mit font-display: swap und preload

- FID (First Input Delay): < 100ms
  → Kein schweres JS beim Laden
  → Crypto-Operationen erst bei User-Interaktion

- CLS (Cumulative Layout Shift): < 0.1
  → Feste Dimensionen für alle Elemente
  → Fonts vorgeladen → kein FOUT/FOIT

- TTI (Time to Interactive): < 3.5s
  → Code-Splitting: Crypto-Lib nur auf /s/ Seiten laden
  → Framer Motion tree-shaken

Werkzeuge:
  → Google PageSpeed Insights (Ziel: 90+ auf Mobile)
  → Lighthouse CI im Build-Prozess
```

### 11.7 Weitere SEO-Maßnahmen

- **Hreflang:** `<link rel="alternate" hreflang="de" href="https://unser-geheimnis.de/" />` (wenn später Englisch: `hreflang="en"` für `/en/`)
- **Favicon + Apple Touch Icon + Web Manifest** — professioneller Auftritt in Suchergebnissen
- **Open Graph Image:** Hochwertiges, branded 1200×630 Vorschaubild mit Logo + Tagline (wird in Social-Shares angezeigt → indirekter SEO-Effekt)
- **Interne Verlinkung:** Footer auf jeder Seite mit Links zu `/so-funktionierts`, `/datenschutz`, `/impressum`
- **Schema.org FAQ:** Auf der „So funktioniert's"-Seite häufige Fragen als FAQ-Schema auszeichnen → Rich Snippets in Google
- **Google Search Console:** Nach Launch einrichten, Sitemap einreichen, Indexierung überwachen

---

## 12. Entwicklungsanweisungen

### 12.1 Reihenfolge der Implementierung

```
Phase 1 — MVP Kern (MUSS):
  ├── 1.  Projektsetup (Next.js/Vite, TypeScript, Tailwind, Prisma)
  ├── 2.  Datenbankschema + Migration
  ├── 3.  lib/crypto.ts — Verschlüsselungsfunktionen (+ Unit Tests!)
  ├── 4.  API: POST /api/secrets (Geheimnis erstellen)
  ├── 5.  API: GET /api/secrets/:id (Geheimnis abrufen + löschen)
  ├── 6.  Frontend: SecretCreator (Text-Modus + TTL-Auswahl)
  ├── 7.  Frontend: SecretRevealer (Entschlüsselung + Anzeige)
  ├── 8.  Cleanup-Scheduler (Cron: Abgelaufene löschen)
  └── 9.  Basis-Sicherheit (Helmet, Rate-Limit, CORS)

Phase 2 — Datei-Upload + Design + SEO:
  ├── 10. Frontend: FileUpload-Komponente (Drag & Drop, 16 MB Limit)
  ├── 11. API: Datei-Upload + verschlüsselte Speicherung
  ├── 12. Frontend: Datei-Download mit Entschlüsselung
  ├── 13. Animationen: RevealAnimation, DownloadAnimation
  ├── 14. Responsive Design + Polish
  ├── 15. Datenschutz + Impressum Seiten
  ├── 16. SEO: Metadata, JSON-LD, robots.txt, sitemap.xml, OG-Image
  └── 17. SEO: Core Web Vitals Optimierung (LCP, FID, CLS)

Phase 3 — Bonus + Härtung:
  ├── 18. Passwortschutz (optionaler zusätzlicher Layer)
  ├── 19. QR-Code-Generierung
  ├── 20. Delete-Token für Ersteller
  ├── 21. Content-Seiten: /so-funktionierts, /fuer-unternehmen, /vergleich
  ├── 22. Security Audit (CSP, Headers, Penetration-Test)
  ├── 23. Admin-Proof Audit (Logging-Check, DB-Backup-Ausschluss)
  ├── 24. Docker-Compose für Deployment
  └── 25. Monitoring + Error-Tracking (Sentry, self-hosted)
```

### 12.2 Code-Qualität

- **TypeScript: Strict Mode** — `"strict": true` in tsconfig
- **Zod** für Runtime-Validierung aller API-Inputs
- **ESLint + Prettier** — Konsistenter Code-Style
- **Tests:** Mindestens für `crypto.ts`, API-Endpunkte und Cleanup-Logik
- **Keine `any` Types** — explizite Typisierung überall
- **Error Boundaries** in React — keine White Screens

### 12.3 Environment Variables

```env
# .env.example
DATABASE_URL="postgresql://user:pass@localhost:5432/geheimnis"
# ODER: DATABASE_URL="file:./dev.db" (SQLite)

NODE_ENV="development"
PORT=3000

# Sicherheit
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=3600000

# Dateispeicher
UPLOAD_DIR="./data/secrets"
MAX_FILE_SIZE_MB=16

# Optional: Benachrichtigungen
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
```

### 12.4 Deployment-Hinweise

- **Hosting-Empfehlung:** Hetzner Cloud (DE), Netcup (DE), oder eigene Infrastruktur — Daten MÜSSEN in der EU bleiben
- **KEIN Vercel/Netlify/Cloudflare für Produktivdaten** (US-Unternehmen, DSGVO-Risiko bei Zugangsdaten-Verarbeitung, auch wenn technisch verschlüsselt)
- **Docker:** Alles containerisiert, `docker-compose up` für Deployment
- **Let's Encrypt / Caddy:** Automatisches TLS
- **Backup: BEWUSST MINIMAL** — Nur DB-Schema-Backup, KEINE Daten-Backups (widerspricht Löschprinzip)

---

## 13. Zusammenfassung: Was diesen Dienst besonders macht

| Feature                    | unser-geheimnis.de           | Typische Konkurrenz (OneTimeSecret etc.) |
|----------------------------|------------------------------|------------------------------------------|
| Verschlüsselung            | **E2E im Browser (Zero-Knowledge)** | Oft serverseitige Verschlüsselung |
| Schlüssel-Management       | **Schlüssel nur im URL-Fragment** | Schlüssel auf Server gespeichert |
| Admin-Zugriff              | **Technisch unmöglich (Admin-Proof)** | Admin kann oft DB lesen |
| Tracking                   | **Null. Kein Analytics, keine Cookies, kein Fingerprinting** | Google Analytics, Cookies, IP-Logging |
| Dateien                    | **Bis 16 MB, verschlüsselt** | Oft nur Text |
| DSGVO                      | **Vollständig konform, DE-Hosting** | US-Hosting, Google Fonts, Tracking |
| Löschung                   | **Überschreiben + Löschen (nicht-wiederherstellbar)** | Oft nur DB-DELETE |
| Design                     | **Hochseriös, animiert**     | Oft Basic/Altbacken |
| TTL-Optionen               | **1–48h, granular**          | Oft nur 24h/7d |
| SEO                        | **SSR, JSON-LD, Core Web Vitals, Content-Seiten** | Meist keine SEO-Strategie |

---

> **Dieses Dokument ist die Single Source of Truth für das gesamte Projekt.**
> Bei Unklarheiten: Sicherheit > Funktionalität > Design.
> Bei DSGVO-Zweifeln: Weniger Daten sammeln, mehr löschen.