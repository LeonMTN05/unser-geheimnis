import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "./db";

/**
 * Server-Geheimnis für HMACs (E-Mail-Hashes, Verifizierungscodes, PoW-Signaturen).
 * In Produktion MUSS APP_SECRET gesetzt sein (mind. 32 Zeichen), sonst sind
 * E-Mail-Funktion und Proof-of-Work deaktiviert.
 */
let devSecret: string | null = null;
export function getAppSecret(): string | null {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") return null;
  if (!devSecret) {
    devSecret = randomBytes(32).toString("hex");
    console.warn("[security] APP_SECRET fehlt — verwende zufälliges Dev-Secret.");
  }
  return devSecret;
}

export function hmac(purpose: string, value: string): string {
  const secret = getAppSecret();
  if (!secret) throw new Error("APP_SECRET not configured");
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("hex");
}

// Rate-Limit-Schlüssel: ohne APP_SECRET ein flüchtiger Prozess-Schlüssel, damit
// "Geheimnis teilen" und Anfragen ohne E-Mail trotzdem funktionieren
// (Zähler beginnen dann nach einem Neustart von vorn).
const ephemeralSecret = randomBytes(32).toString("hex");
function rlHash(value: string): string {
  return createHmac("sha256", getAppSecret() ?? ephemeralSecret).update(`rl:${value}`).digest("hex");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Pseudonymisierter Schlüssel für eine E-Mail-Adresse (Blockliste, Rate-Limits). */
export function emailKey(email: string): string {
  return hmac("email", normalizeEmail(email));
}

/**
 * Client-IP. Apache verwirft ein vom Client gesendetes X-Forwarded-For
 * (RequestHeader unset) und setzt es selbst — der erste Eintrag ist daher echt.
 */
export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

// ── Rate-Limits (DB-basiert, überleben Neustarts) ─────────────────────

type Window = { max: number; ms: number };
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const envInt = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const LIMITS = {
  // Anfrage ohne E-Mail
  create:        [{ max: 20, ms: HOUR }],
  // Anfrage mit E-Mail (löst Bestätigungsmail aus)
  mailIp:        [{ max: 5, ms: HOUR }, { max: 15, ms: DAY }],
  mailSender:    [{ max: 3, ms: HOUR }, { max: 10, ms: DAY }],
  // Einladungen an denselben Empfänger — egal von welchem Absender
  mailRecipient: [{ max: 3, ms: DAY }],
  // Globale Notbremse
  mailGlobal:    [{ max: envInt("MAIL_DAILY_LIMIT", 300), ms: DAY }],
  verifyIp:      [{ max: 20, ms: HOUR }],
  respond:       [{ max: 20, ms: HOUR }],
  retrieve:      [{ max: 600, ms: HOUR }], // Status-Polling; Token hat 256 Bit
  powIssue:      [{ max: 60, ms: HOUR }],
} satisfies Record<string, Window[]>;

export type LimitScope = keyof typeof LIMITS;

export async function countEventsFor(scope: string, key: string, sinceMs: number) {
  return countEvents(scope, rlHash(key), sinceMs);
}

export async function countEvents(scope: string, keyHash: string, sinceMs: number) {
  return prisma.rateEvent.count({
    where: { scope, keyHash, createdAt: { gt: new Date(Date.now() - sinceMs) } },
  });
}

/** true = Limit noch nicht erreicht. */
export async function underLimit(scope: LimitScope, key: string): Promise<boolean> {
  const keyHash = rlHash(key);
  for (const w of LIMITS[scope]) {
    if ((await countEvents(scope, keyHash, w.ms)) >= w.max) return false;
  }
  return true;
}

export async function recordEvent(scope: LimitScope | "pow", key: string) {
  await prisma.rateEvent.create({ data: { scope, keyHash: rlHash(key) } });
}

/** Prüft und zählt in einem Schritt. */
export async function consume(scope: LimitScope, key: string): Promise<boolean> {
  if (!(await underLimit(scope, key))) return false;
  await recordEvent(scope, key);
  return true;
}

export async function isBlocked(email: string): Promise<boolean> {
  return !!(await prisma.mailBlock.findUnique({ where: { emailHash: emailKey(email) } }));
}

// ── Abmelde-Token (signiert, damit niemand fremde Adressen sperren kann) ──

export function optOutSignature(emailHash: string): string {
  return hmac("optout", emailHash).slice(0, 32);
}

export function optOutUrl(email: string): string {
  const e = emailKey(email);
  return `${siteUrl()}/anfrage/abmelden?e=${e}&s=${optOutSignature(e)}`;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}
