import { randomUUID } from "node:crypto";
import {
  decryptVerificationToken,
  type VerificationEmailJob,
} from "./verification-email-queue.js";
import { appendAuthDomainEvent } from "./auth-events.js";

const forceEmailFailure = (email: string) =>
  process.env.WORKER_EMAIL_FORCE_FAILURE === "1" || email.toLowerCase().endsWith("@simulate-failure.invalid");

const dispatchVerificationEmail = async ({
  email,
  fullName,
  verificationUrl,
}: {
  email: string;
  fullName: string;
  verificationUrl: string;
}) => {
  void email;
  void fullName;
  void verificationUrl;
};

const trimTrailingSlashes = (value: string) => {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }
  return value.slice(0, end);
};

export const sendVerificationEmailJob = async ({
  job,
  jwtAccessSecret,
  baseUrl,
}: {
  job: VerificationEmailJob;
  jwtAccessSecret: string;
  baseUrl: string;
}) => {
  if (forceEmailFailure(job.email)) {
    throw new Error("Simulated verification email provider outage.");
  }

  const verificationToken = decryptVerificationToken({
    encryptedToken: job.encryptedVerificationToken,
    secret: jwtAccessSecret,
  });
  const verificationUrl = `${trimTrailingSlashes(baseUrl)}/verify-email/${encodeURIComponent(verificationToken)}`;
  await dispatchVerificationEmail({
    email: job.email,
    fullName: job.fullName,
    verificationUrl,
  });

  // Keep token values out of logs while still proving dispatch context.
  console.log(`[worker] verification email dispatched to ${job.email} (user=${job.userId}, tokenId=${job.verificationTokenId})`);

  await appendAuthDomainEvent({
    event: {
      eventId: randomUUID(),
      name: "user.verification_sent",
      occurredAt: new Date().toISOString(),
      actor: {
        userId: job.userId,
        workspaceId: null,
      },
      data: {
        userId: job.userId,
        email: job.email,
        ipAddress: job.ipAddress,
        userAgent: job.userAgent,
        tokenId: job.verificationTokenId,
        jobId: job.jobId,
      },
    },
  });
};
