export const ALLOWED_TTL_HOURS = [1, 2, 4, 8, 12, 24, 48] as const;

export type ValidTTL = typeof ALLOWED_TTL_HOURS[number];

// Limits
export const MAX_TEXT_LENGTH = 100000; // max length for text secrets
export const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

// Base64 overhead is ~33%, so we allow some buffer for the base64 encoded payload
export const MAX_PAYLOAD_SIZE_BYTES = Math.floor(MAX_FILE_SIZE_BYTES * 1.5); 

export const DEFAULT_BURN_AFTER_READ = false;
