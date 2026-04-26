import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { fromBase64Url, toBase64Url } from "./verification-email.js";

const deriveEncryptionKey = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

export const encryptVerificationToken = ({ token, secret }: { token: string; secret: string }) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
};

export const decryptVerificationToken = ({
  encryptedToken,
  secret,
}: {
  encryptedToken: string;
  secret: string;
}) => {
  const parts = encryptedToken.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error("Invalid verification token payload.");
  }

  const [ivPart, tagPart, cipherPart] = parts;
  const decipher = createDecipheriv("aes-256-gcm", deriveEncryptionKey(secret), fromBase64Url(ivPart));
  decipher.setAuthTag(fromBase64Url(tagPart));
  const decrypted = Buffer.concat([decipher.update(fromBase64Url(cipherPart)), decipher.final()]);

  return decrypted.toString("utf8");
};
