import { createCipheriv, createHash, randomBytes } from "node:crypto";
import {
  createVerificationEmailJob,
  enqueueVerificationEmailJob as enqueueSharedVerificationEmailJob,
  toBase64Url,
  type VerificationEmailJob,
} from "../../../../packages/shared/src/queues/verification-email.js";

const deriveEncryptionKey = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

export { createVerificationEmailJob, type VerificationEmailJob };

export const encryptVerificationToken = ({ token, secret }: { token: string; secret: string }) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
};

export const enqueueVerificationEmailJob = async ({
  job,
  queueFilePath,
}: {
  job: VerificationEmailJob;
  queueFilePath?: string;
}) =>
  enqueueSharedVerificationEmailJob({
    job,
    queueFilePath,
  });
