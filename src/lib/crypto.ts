// src/lib/crypto.ts

export async function encryptSecret(plaintext: string | ArrayBuffer): Promise<{
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  key: CryptoKey;
}> {
  // 1. Schlüssel generieren (256-bit AES-GCM)
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable → wir müssen ihn exportieren für URL
    ['encrypt', 'decrypt']
  );
  
  // 2. IV generieren (12 Bytes)
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

export async function exportKeyToBase64url(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64url(raw);
}

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
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encryptedData as BufferSource
  );
}

// === HILFSFUNKTIONEN FÜR BASE64URL KODIERUNG ===

export function arrayBufferToBase64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  // Verwende kleine Chunks, um "Maximum call stack size exceeded" bei großen Dateien zu vermeiden
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Base64Url Format in Standard Base64 umwandeln
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Padding hinzufügen falls nötig
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) throw new Error('Invalid base64url string');
    base64 += new Array(5 - pad).join('=');
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// === PASSWORTSCHUTZ (PBKDF2 + AES-GCM) ===
// Fragment-Format bei Passwort: "p.<salt_b64url>.<iv_b64url>.<encryptedKey_b64url>"
// Der AES-Key wird mit einem PBKDF2-abgeleiteten Schlüssel verschlüsselt.
// Der Server weiß nicht ob ein Passwort gesetzt ist — Zero-Knowledge bleibt erhalten.

const PBKDF2_ITERATIONS = 250_000;

export async function encryptKeyWithPassword(
  key: CryptoKey,
  password: string
): Promise<{ salt: Uint8Array; iv: Uint8Array; encryptedKey: ArrayBuffer }> {
  const salt = new Uint8Array(crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer);
  const iv   = new Uint8Array(crypto.getRandomValues(new Uint8Array(12)).buffer as ArrayBuffer);

  const passKeyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const rawKey = await crypto.subtle.exportKey('raw', key);
  const encryptedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, derivedKey, rawKey);

  return { salt, iv, encryptedKey };
}

export async function decryptKeyWithPassword(
  encryptedKey: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array,
  password: string
): Promise<CryptoKey> {
  const passKeyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const rawKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, derivedKey, encryptedKey);
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

/** Baut das URL-Fragment für passwortgeschützte Geheimnisse */
export function buildPasswordFragment(
  salt: Uint8Array,
  iv: Uint8Array,
  encryptedKey: ArrayBuffer
): string {
  return `p.${arrayBufferToBase64url(salt)}.${arrayBufferToBase64url(iv)}.${arrayBufferToBase64url(encryptedKey)}`;
}

/** Parst das URL-Fragment und erkennt automatisch ob Passwort gesetzt ist */
export function parseFragment(fragment: string):
  | { type: 'key'; rawKey: string }
  | { type: 'password'; salt: Uint8Array; iv: Uint8Array; encryptedKey: ArrayBuffer } {
  if (fragment.startsWith('p.')) {
    const parts = fragment.slice(2).split('.');
    if (parts.length === 3) {
      return {
        type: 'password',
        salt: new Uint8Array(base64urlToArrayBuffer(parts[0])),
        iv:   new Uint8Array(base64urlToArrayBuffer(parts[1])),
        encryptedKey: base64urlToArrayBuffer(parts[2]),
      };
    }
  }
  return { type: 'key', rawKey: fragment };
}

// Helper zum Konvertieren von ArrayBuffer ↔ Base64 (für die API Übertragung)
export function arrayBufferToBase64(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
