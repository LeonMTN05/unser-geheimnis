import { z } from "zod";
import { expiresInSchema, ivSchema } from "./validation";
import { MAX_PAYLOAD_SIZE_BYTES } from "./constants";

export const REQUEST_MESSAGE_MAX = 300;
export const REQUEST_NAME_MAX = 60;

// ECDH P-256 SPKI = 91 Bytes → 122 Zeichen base64url
export const publicKeySchema = z.string().regex(/^[A-Za-z0-9_-]{122}$/);

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Links und Domains in Freitext würden in der Einladungsmail landen
 * (Phishing-Vektor) — daher nicht erlaubt, wenn per E-Mail versendet wird.
 */
const LINKISH = /(https?:|ftp:|mailto:|www\.|:\/\/|\b[a-z0-9-]{2,}\.(?:[a-z]{2,24})\b)/i;
export function containsLink(s: string): boolean {
  return LINKISH.test(s);
}

// Steuerzeichen raus (außer Zeilenumbruch), max. 6 Zeilen
const cleanText = (max: number) =>
  z.string().max(max).transform((s) =>
    s.replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
     .replace(/\n{3,}/g, "\n\n")
     .trim()
  );

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const createRequestSchema = z.object({
  publicKey: publicKeySchema,
  message: cleanText(REQUEST_MESSAGE_MAX).optional(),
  requesterName: cleanText(REQUEST_NAME_MAX).refine((s) => !s.includes("\n")).optional(),
  expiresIn: expiresInSchema,
  email: z.object({ sender: emailSchema, recipient: emailSchema }).optional(),
  pow: z.unknown().optional(),
  website: z.string().max(200).optional(), // Honeypot — muss leer bleiben
  elapsedMs: z.number().optional(),        // Zeit zum Ausfüllen (Bot-Indiz)
});

export const verifyRequestSchema = z.union([
  z.object({ code: z.string().regex(/^\d{6}$/) }),
  z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
]);

export const respondTextSchema = z.object({
  type: z.literal("TEXT"),
  encryptedData: z.string().min(1).max(MAX_PAYLOAD_SIZE_BYTES).regex(BASE64),
  iv: ivSchema,
  ephemeralPublicKey: publicKeySchema,
});

// Verschlüsselte Metadaten: IV (12) + Ciphertext, base64 — max. ~1 KB
export const encryptedMetaSchema = z.string().min(20).max(1500).regex(BASE64);

export const respondFileMetaSchema = z.object({
  iv: ivSchema,
  ephemeralPublicKey: publicKeySchema,
  encryptedMeta: encryptedMetaSchema,
});
