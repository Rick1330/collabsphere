import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
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

const queueLockAcquireTimeoutMs = 5_000;
const queueLockPollIntervalMs = 25;

export const defaultVerificationEmailQueueFilePath = () =>
  path.resolve(process.cwd(), ".tmp", "queues", "verification-email-jobs.json");

export const toBase64Url = (value: Buffer) =>
  value
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");

export const fromBase64Url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
};

export const isVerificationEmailJob = (value: unknown): value is VerificationEmailJob => {
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

export const readVerificationEmailJobs = async ({ queueFilePath }: { queueFilePath: string }) => {
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

export const writeVerificationEmailJobs = async ({
  queueFilePath,
  jobs,
}: {
  queueFilePath: string;
  jobs: VerificationEmailJob[];
}) => {
  await mkdir(path.dirname(queueFilePath), { recursive: true });
  const temporaryQueueFilePath = `${queueFilePath}.${randomBytes(8).toString("hex")}.tmp`;
  let renamed = false;

  try {
    await writeFile(temporaryQueueFilePath, `${JSON.stringify(jobs, null, 2)}\n`, "utf8");
    await rename(temporaryQueueFilePath, queueFilePath);
    renamed = true;
  } finally {
    if (!renamed) {
      await rm(temporaryQueueFilePath, { force: true }).catch(() => undefined);
    }
  }
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const acquireQueueLock = async (lockFilePath: string) => {
  const startedAt = Date.now();

  while (true) {
    try {
      const lockHandle = await open(lockFilePath, "wx");
      await lockHandle.close();
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== "EEXIST") {
        throw error;
      }

      if (Date.now() - startedAt >= queueLockAcquireTimeoutMs) {
        throw new Error(`Timed out acquiring verification queue lock: ${lockFilePath}`);
      }

      await wait(queueLockPollIntervalMs);
    }
  }
};

const releaseQueueLock = async (lockFilePath: string) => {
  await rm(lockFilePath, { force: true }).catch((error) => {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  });
};

export const withVerificationEmailQueueLock = async <T>({
  queueFilePath,
  operation,
}: {
  queueFilePath: string;
  operation: () => Promise<T>;
}) => {
  const queueDirectory = path.dirname(queueFilePath);
  const lockFilePath = `${queueFilePath}.lock`;

  await mkdir(queueDirectory, { recursive: true });
  await acquireQueueLock(lockFilePath);

  try {
    return await operation();
  } finally {
    await releaseQueueLock(lockFilePath);
  }
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
  queueFilePath = defaultVerificationEmailQueueFilePath(),
}: {
  job: VerificationEmailJob;
  queueFilePath?: string;
}) =>
  withVerificationEmailQueueLock({
    queueFilePath,
    operation: async () => {
      const jobs = await readVerificationEmailJobs({ queueFilePath });
      jobs.push(job);
      await writeVerificationEmailJobs({ queueFilePath, jobs });
    },
  });

export const dequeueDueVerificationEmailJobs = async ({
  now = new Date(),
  limit = 10,
  queueFilePath = defaultVerificationEmailQueueFilePath(),
}: {
  now?: Date;
  limit?: number;
  queueFilePath?: string;
}) =>
  withVerificationEmailQueueLock({
    queueFilePath,
    operation: async () => {
      const jobs = await readVerificationEmailJobs({ queueFilePath });
      const dueJobs: VerificationEmailJob[] = [];
      const pendingJobs: VerificationEmailJob[] = [];
      const nowTime = now.getTime();

      for (const job of jobs) {
        const isDue = new Date(job.nextAttemptAt).getTime() <= nowTime;

        if (isDue && dueJobs.length < limit) {
          dueJobs.push(job);
          continue;
        }

        pendingJobs.push(job);
      }

      if (dueJobs.length > 0) {
        await writeVerificationEmailJobs({
          queueFilePath,
          jobs: pendingJobs,
        });
      }

      return dueJobs;
    },
  });
