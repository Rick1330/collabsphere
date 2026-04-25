import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type VerificationEmailJob = {
  jobId: string;
  createdAt: string;
  nextAttemptAt: string;
  attempts: number;
  maxAttempts: number;
  userId: string;
  email: string;
  fullName: string;
  verificationTokenId: string;
  encryptedVerificationToken: string;
};

const defaultQueueFilePath = () =>
  path.resolve(process.cwd(), ".tmp", "queues", "verification-email-jobs.json");

const isVerificationEmailJob = (value: unknown): value is VerificationEmailJob => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<VerificationEmailJob>;
  return (
    typeof candidate.jobId === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.nextAttemptAt === "string" &&
    typeof candidate.attempts === "number" &&
    typeof candidate.maxAttempts === "number" &&
    typeof candidate.userId === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.fullName === "string" &&
    typeof candidate.verificationTokenId === "string" &&
    typeof candidate.encryptedVerificationToken === "string"
  );
};

const readJobs = async ({ queueFilePath }: { queueFilePath: string }) => {
  try {
    const raw = await readFile(queueFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as VerificationEmailJob[];
    }

    return parsed.filter(isVerificationEmailJob);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return [] as VerificationEmailJob[];
    }

    throw error;
  }
};

const writeJobs = async ({
  queueFilePath,
  jobs,
}: {
  queueFilePath: string;
  jobs: VerificationEmailJob[];
}) => {
  await mkdir(path.dirname(queueFilePath), { recursive: true });
  await writeFile(queueFilePath, `${JSON.stringify(jobs, null, 2)}\n`, "utf8");
};

const deriveEncryptionKey = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

const toBase64Url = (value: Buffer) =>
  value
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");

export const encryptVerificationToken = ({ token, secret }: { token: string; secret: string }) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
};

export const createVerificationEmailJob = ({
  userId,
  email,
  fullName,
  verificationTokenId,
  encryptedVerificationToken,
  now = new Date(),
}: {
  userId: string;
  email: string;
  fullName: string;
  verificationTokenId: string;
  encryptedVerificationToken: string;
  now?: Date;
}): VerificationEmailJob => ({
  jobId: randomBytes(16).toString("hex"),
  createdAt: now.toISOString(),
  nextAttemptAt: now.toISOString(),
  attempts: 0,
  maxAttempts: 3,
  userId,
  email,
  fullName,
  verificationTokenId,
  encryptedVerificationToken,
});

export const enqueueVerificationEmailJob = async ({
  job,
  queueFilePath = defaultQueueFilePath(),
}: {
  job: VerificationEmailJob;
  queueFilePath?: string;
}) => {
  const jobs = await readJobs({ queueFilePath });
  jobs.push(job);
  await writeJobs({ queueFilePath, jobs });
};
