import { randomBytes, randomInt } from "crypto";
import { countEventsFor, hmac, recordEvent, safeEqualHex, sha256 } from "./security";

/**
 * Unsichtbarer Proof-of-Work nach dem ALTCHA-Prinzip — selbst gehostet,
 * ohne Drittanbieter, ohne Cookies (DSGVO-freundlich).
 *
 * Server: wählt eine Zufallszahl n ≤ max und schickt challenge = SHA-256(salt + n).
 * Browser: probiert 0..max durch, bis der Hash passt (~0,5–2 s CPU).
 *
 * Gegen einfaches Umgehen:
 *  - HMAC-signiert (nicht fälschbar), läuft nach 5 Minuten ab
 *  - an die IP gebunden (keine Lösungen auf anderen Rechnern "vorrechnen")
 *  - nur einmal verwendbar (Replay-Schutz in der DB)
 *  - Schwierigkeit steigt mit der Aktivität der IP
 * PoW macht Massenmissbrauch teuer, ist aber kein Allheilmittel — die
 * eigentliche Grenze ziehen Double-Opt-in und die Rate-Limits.
 */

const TTL_MS = 5 * 60_000;
const inFlight = new Set<string>();
const BASE_MAX = 100_000;

export interface PowChallenge {
  algorithm: "SHA-256";
  salt: string;
  challenge: string;
  maxnumber: number;
  signature: string;
}

export interface PowSolution extends PowChallenge {
  number: number;
}

function ipTag(ip: string) {
  return hmac("powip", ip).slice(0, 16);
}

async function difficultyFor(ip: string): Promise<number> {
  // Wie viele E-Mail-Anfragen kamen in der letzten Stunde von dieser IP?
  const recent = await countEventsFor("mailIp", ip, 3_600_000);
  if (recent >= 4) return BASE_MAX * 15;
  if (recent >= 2) return BASE_MAX * 5;
  return BASE_MAX;
}

export async function createChallenge(ip: string): Promise<PowChallenge> {
  const maxnumber = await difficultyFor(ip);
  const expires = Date.now() + TTL_MS;
  const salt = `${randomBytes(12).toString("hex")}.${expires}.${ipTag(ip)}.`;
  const number = randomInt(0, maxnumber + 1);
  const challenge = sha256(salt + number);
  const signature = hmac("pow", `${salt}|${challenge}|${maxnumber}`);
  return { algorithm: "SHA-256", salt, challenge, maxnumber, signature };
}

export async function verifySolution(sol: unknown, ip: string): Promise<boolean> {
  if (!sol || typeof sol !== "object") return false;
  const s = sol as Partial<PowSolution>;
  if (
    typeof s.salt !== "string" || s.salt.length > 100 ||
    typeof s.challenge !== "string" || !/^[0-9a-f]{64}$/.test(s.challenge) ||
    typeof s.signature !== "string" || !/^[0-9a-f]{64}$/.test(s.signature) ||
    !Number.isInteger(s.number) || !Number.isInteger(s.maxnumber) ||
    s.number! < 0 || s.number! > s.maxnumber!
  ) return false;

  const expected = hmac("pow", `${s.salt}|${s.challenge}|${s.maxnumber}`);
  if (!safeEqualHex(expected, s.signature)) return false;

  const [, expiresStr, tag] = s.salt.split(".");
  if (!(Number(expiresStr) > Date.now())) return false;
  if (tag !== ipTag(ip)) return false;

  // Mindestens die aktuell für diese IP geforderte Schwierigkeit
  if (s.maxnumber! < (await difficultyFor(ip))) return false;

  if (sha256(s.salt + s.number) !== s.challenge) return false;

  // Replay-Schutz: jede Challenge genau einmal. Das synchrone Set verhindert,
  // dass parallele Requests mit derselben Lösung gleichzeitig durchrutschen;
  // die DB deckt Neustarts ab.
  if (inFlight.has(s.challenge)) return false;
  inFlight.add(s.challenge);
  setTimeout(() => inFlight.delete(s.challenge!), TTL_MS * 2).unref?.();
  if ((await countEventsFor("pow", s.challenge, TTL_MS * 2)) > 0) return false;
  await recordEvent("pow", s.challenge);
  return true;
}
