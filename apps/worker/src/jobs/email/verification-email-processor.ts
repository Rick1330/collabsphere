import {
  createVerificationEmailJob,
  dequeueDueVerificationEmailJobs,
  enqueueVerificationEmailJob,
  type VerificationEmailJob,
} from "./verification-email-queue.js";
import { sendVerificationEmailJob } from "./verification-email-job.js";

const defaultPollIntervalMs = 2000;
// Retry policy: initial attempt + 3 retries (30s, 120s, 300s).
const retryBackoffMs = [30_000, 120_000, 300_000] as const;
const maxJobsPerTick = 5;

const computeNextAttemptTime = ({ attempts, now }: { attempts: number; now: Date }) => {
  const backoffIndex = Math.max(0, Math.min(retryBackoffMs.length - 1, attempts - 1));
  return new Date(now.getTime() + retryBackoffMs[backoffIndex]);
};

const createRetryJob = ({
  job,
  attemptedAt,
  attempts,
}: {
  job: VerificationEmailJob;
  attemptedAt: Date;
  attempts: number;
}) => {
  const retryJob = createVerificationEmailJob({
    userId: job.userId,
    email: job.email,
    fullName: job.fullName,
    ipAddress: job.ipAddress,
    userAgent: job.userAgent,
    verificationTokenId: job.verificationTokenId,
    encryptedVerificationToken: job.encryptedVerificationToken,
    now: attemptedAt,
  });

  retryJob.jobId = job.jobId;
  retryJob.createdAt = job.createdAt;
  retryJob.attempts = attempts;
  retryJob.maxAttempts = job.maxAttempts;
  retryJob.nextAttemptAt = computeNextAttemptTime({
    attempts,
    now: attemptedAt,
  }).toISOString();

  return retryJob;
};

export const startVerificationEmailProcessor = ({
  jwtAccessSecret,
  baseUrl,
  pollIntervalMs = defaultPollIntervalMs,
}: {
  jwtAccessSecret: string;
  baseUrl: string;
  pollIntervalMs?: number;
}) => {
  let processing = false;

  const tick = async () => {
    if (processing) {
      return;
    }

    processing = true;

    try {
      const now = new Date();
      const dueJobs = await dequeueDueVerificationEmailJobs({
        now,
        limit: maxJobsPerTick,
      });

      for (const job of dueJobs) {
        try {
          await sendVerificationEmailJob({
            job,
            jwtAccessSecret,
            baseUrl,
          });
        } catch (error) {
          const attempts = job.attempts + 1;
          const isRetryable = attempts < job.maxAttempts;
          const message = error instanceof Error ? error.message : String(error);

          if (isRetryable) {
            try {
              const retryJob = createRetryJob({
                job,
                attemptedAt: now,
                attempts,
              });
              await enqueueVerificationEmailJob({
                job: retryJob,
              });
              console.warn(
                `[worker] verification job retry scheduled (job=${job.jobId}, attempts=${attempts}/${job.maxAttempts}, reason=${message})`,
              );
            } catch (enqueueError) {
              const enqueueMessage =
                enqueueError instanceof Error ? enqueueError.message : String(enqueueError);
              console.error(
                `[worker] failed to re-enqueue retry job (job=${job.jobId}, reason=${enqueueMessage})`,
              );
            }
            continue;
          }

          console.error(
            `[worker] verification job permanently failed (job=${job.jobId}, attempts=${attempts}/${job.maxAttempts}, reason=${message})`,
          );
        }
      }
    } catch (tickError) {
      const tickMessage = tickError instanceof Error ? tickError.message : String(tickError);
      console.error(`[worker] verification email processor tick failed: ${tickMessage}`);
    } finally {
      processing = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, pollIntervalMs);

  void tick();

  return () => clearInterval(timer);
};
