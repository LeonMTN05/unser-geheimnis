// Ende-zu-Ende-Verschlüsselung für Datenanfragen (läuft nur im Browser).
//
// Anfragender: erzeugt ECDH-P-256-Schlüsselpaar. Öffentlicher Schlüssel → Server,
//              privater Schlüssel → nur im Fragment des Abruf-Links.
// Antwortender: erzeugt ein Einmal-Schlüsselpaar, leitet per ECDH + HKDF einen
//              AES-256-GCM-Schlüssel ab und verschlüsselt damit.
// Der Server sieht nur öffentliche Schlüssel und Ciphertext.

import { arrayBufferToBase64url, base64urlToArrayBuffer, arrayBufferToBase64, base64ToArrayBuffer } from "./crypto";

const ECDH = { name: "ECDH", namedCurve: "P-256" } as const;
const INFO = new TextEncoder().encode("unser-geheimnis.de/request/v1");

export async function generateRequestKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const kp = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]);
  const pub = await crypto.subtle.exportKey("spki", kp.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return { publicKey: arrayBufferToBase64url(pub), privateKey: arrayBufferToBase64url(priv) };
}

async function deriveAesKey(privateKey: CryptoKey, publicKey: CryptoKey, ephemeralSpki: ArrayBuffer) {
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  const hkdfKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    // Salt bindet den Schlüssel an das konkrete Einmal-Schlüsselpaar
    { name: "HKDF", hash: "SHA-256", salt: ephemeralSpki, info: INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface SealedResponse {
  aesKey: CryptoKey;
  ephemeralPublicKey: string; // base64url SPKI
}

/** Antwortender: Schlüssel für die Antwort ableiten. */
export async function sealForRequester(requesterPublicKey: string): Promise<SealedResponse> {
  const pub = await crypto.subtle.importKey("spki", base64urlToArrayBuffer(requesterPublicKey), ECDH, false, []);
  const eph = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]);
  const ephSpki = await crypto.subtle.exportKey("spki", eph.publicKey);
  const aesKey = await deriveAesKey(eph.privateKey, pub, ephSpki);
  return { aesKey, ephemeralPublicKey: arrayBufferToBase64url(ephSpki) };
}

/** Anfragender: Schlüssel aus privatem Schlüssel (Fragment) wiederherstellen. */
export async function openFromResponder(privateKeyB64url: string, ephemeralPublicKey: string): Promise<CryptoKey> {
  const priv = await crypto.subtle.importKey("pkcs8", base64urlToArrayBuffer(privateKeyB64url), ECDH, false, ["deriveBits"]);
  const ephSpki = base64urlToArrayBuffer(ephemeralPublicKey);
  const ephPub = await crypto.subtle.importKey("spki", ephSpki, ECDH, false, []);
  return deriveAesKey(priv, ephPub, ephSpki);
}

export async function aesEncrypt(key: CryptoKey, data: ArrayBuffer | Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data as BufferSource);
  return { iv, ciphertext: ct };
}

export async function aesDecrypt(key: CryptoKey, iv: Uint8Array, data: ArrayBuffer) {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data);
}

/** Dateiname/MIME verschlüsselt: base64(iv || ciphertext) */
export async function encryptMeta(key: CryptoKey, meta: { name: string; mime: string }): Promise<string> {
  const { iv, ciphertext } = await aesEncrypt(key, new TextEncoder().encode(JSON.stringify(meta)));
  const out = new Uint8Array(12 + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), 12);
  return arrayBufferToBase64(out);
}

export async function decryptMeta(key: CryptoKey, b64: string): Promise<{ name: string; mime: string }> {
  const bytes = new Uint8Array(base64ToArrayBuffer(b64));
  const pt = await aesDecrypt(key, bytes.slice(0, 12), bytes.slice(12).buffer);
  const parsed = JSON.parse(new TextDecoder().decode(pt));
  return { name: String(parsed.name || "datei.bin").slice(0, 255), mime: String(parsed.mime || "application/octet-stream") };
}

// ── Proof-of-Work lösen (siehe src/server/pow.ts) ─────────────────────

export interface PowChallenge {
  algorithm: string; salt: string; challenge: string; maxnumber: number; signature: string;
}

export async function solvePow(ch: PowChallenge, signal?: AbortSignal): Promise<PowChallenge & { number: number }> {
  const enc = new TextEncoder();
  const target = new Uint8Array(32);
  for (let i = 0; i < 32; i++) target[i] = parseInt(ch.challenge.slice(i * 2, i * 2 + 2), 16);
  outer: for (let n = 0; n <= ch.maxnumber; n++) {
    if ((n & 1023) === 0 && signal?.aborted) throw new Error("aborted");
    const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(ch.salt + n)));
    for (let i = 0; i < 32; i++) if (d[i] !== target[i]) continue outer;
    return { ...ch, number: n };
  }
  throw new Error("Proof-of-Work nicht lösbar");
}
