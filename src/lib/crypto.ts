import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const SECRET = process.env.CREDENTIALS_SECRET ?? process.env.AUTH_SECRET ?? "sitekoom-insecure-secret-change-me";

function key(): Buffer {
  // Derive a 32-byte AES-256 key from the secret.
  return createHash("sha256").update(SECRET).digest();
}

// Format: base64(iv).base64(tag).base64(ciphertext)
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(encrypted: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = encrypted.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
