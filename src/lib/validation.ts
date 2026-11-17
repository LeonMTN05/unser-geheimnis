import { z } from "zod";
import { ALLOWED_TTL_HOURS, MAX_PAYLOAD_SIZE_BYTES } from "./constants";

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const expiresInSchema = z.number().refine(
  (val): val is typeof ALLOWED_TTL_HOURS[number] =>
    (ALLOWED_TTL_HOURS as readonly number[]).includes(val),
  { message: "Invalid expiration time" }
);

// AES-GCM-IV: 12 Bytes = 16 Base64-Zeichen
export const ivSchema = z.string().length(16).regex(BASE64);

export const createSecretSchema = z.object({
  encryptedData: z.string().min(1).max(MAX_PAYLOAD_SIZE_BYTES).regex(BASE64),
  iv: ivSchema,
  type: z.enum(["TEXT", "FILE"]),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(255).optional(),
  expiresIn: expiresInSchema,
  burnAfterRead: z.boolean().default(true),
});

export const createFileSecretSchema = z.object({
  iv: ivSchema,
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(255),
  expiresIn: expiresInSchema,
  burnAfterRead: z.boolean(),
});

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
