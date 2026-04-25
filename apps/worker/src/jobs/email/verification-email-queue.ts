import { createDecipheriv, createHash } from "node:crypto";
import {
  createVerificationEmailJob,
  dequeueDueVerificationEmailJobs as dequeueSharedVerificationEmailJobs,
  enqueueVerificationEmailJob as enqueueSharedVerificationEmailJob,
  fromBase64Url,
  type VerificationEmailJob,
} from "../../../../../packages/shared/src/queues/verification-email.js";

const deriveEncryptionKey = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

export { createVerificationEmailJob, type VerificationEmailJob };

export const decryptVerificationToken = ({
  encryptedToken,
  secret,
}: {
  encryptedToken: string;
  secret: string;
}) => {
  const [ivPart, tagPart, cipherPart] = encryptedToken.split(".");

  if (!ivPart || !tagPart || !cipherPart) {
    throw new Error("Invalid verification token payload.");
  }

  const decipher = createDecipheriv("aes-256-gcm", deriveEncryptionKey(secret), fromBase64Url(ivPart));
  decipher.setAuthTag(fromBase64Url(tagPart));
  const decrypted = Buffer.concat([decipher.update(fromBase64Url(cipherPart)), decipher.final()]);

  return decrypted.toString("utf8");
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

export const dequeueDueVerificationEmailJobs = async ({
  now,
  limit,
  queueFilePath,
}: {
  now?: Date;
  limit?: number;
  queueFilePath?: string;
}) =>
  dequeueSharedVerificationEmailJobs({
    now,
    limit,
    queueFilePath,
  });
