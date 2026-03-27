import { z } from "zod";
import { ALLOWED_TTL_HOURS, MAX_PAYLOAD_SIZE_BYTES } from "./constants";

export const createSecretSchema = z.object({
  encryptedData: z.string().min(1).max(MAX_PAYLOAD_SIZE_BYTES),
  iv: z.string().min(1), // Base64 kodiert, ca 16-24 Zeichen
  type: z.enum(["TEXT", "FILE"]),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  expiresIn: z.number().refine((val): val is typeof ALLOWED_TTL_HOURS[number] => (ALLOWED_TTL_HOURS as readonly number[]).includes(val), {
    message: "Invalid expiration time",
  }),
  burnAfterRead: z.boolean().default(true),
});

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
