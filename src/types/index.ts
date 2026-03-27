export type SecretType = "TEXT" | "FILE";

export interface CreateSecretRequest {
  encryptedData: string;   // Base64-kodierter AES-256-GCM Ciphertext
  iv: string;              // Base64-kodierter IV
  type: SecretType;
  fileName?: string;       // Original-Dateiname (verschlüsselt via AES-GCM)
  fileSize?: number;       // Dateigröße in Bytes
  mimeType?: string;       // MIME-Type (verschlüsselt oder im Klartext)
  expiresIn: number;       // Ablaufzeit in Stunden
  burnAfterRead?: boolean; // Default: true
}

export interface CreateSecretResponse {
  id: string;
  expiresAt: string;       // ISO 8601 UTC Timestamp
}

export interface GetSecretResponse {
  encryptedData: string;
  iv: string;
  type: SecretType;
  fileName?: string;
  mimeType?: string;
  expiresAt: string;
}

export interface ApiError {
  error: string;
}
