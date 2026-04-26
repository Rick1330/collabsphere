import type { PrismaClient } from "@prisma/client";

export type ExistingAuthUser = {
  id: string;
  authProvider: "local" | "google";
};

export type CreatedAuthUser = {
  id: string;
  email: string;
  fullName: string;
};

export type CreatedVerificationToken = {
  id: string;
};

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export type VerifiedAuthUser = {
  id: string;
  email: string;
};

export type RegisterRepository = {
  findActiveUserByEmail: (email: string) => Promise<ExistingAuthUser | null>;
  createLocalUserWithVerificationToken: (input: {
    email: string;
    fullName: string;
    passwordHash: string;
    tokenHash: string;
    expiresAt: Date;
  }) => Promise<{
    user: CreatedAuthUser;
    verificationToken: CreatedVerificationToken;
  }>;
};

export type VerifyEmailRepository = {
  findEmailVerificationByHash: (tokenHash: string) => Promise<EmailVerificationRecord | null>;
  consumeEmailVerificationToken: (input: {
    tokenId: string;
    userId: string;
    verifiedAt: Date;
  }) => Promise<VerifiedAuthUser | null>;
};

export const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Partial<{ code: unknown }>;
  return candidate.code === "P2002";
};

export const isPrismaRecordNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Partial<{ code: unknown }>;
  return candidate.code === "P2025";
};

export const createPrismaRegisterRepository = ({
  prisma,
}: {
  prisma: PrismaClient;
}): RegisterRepository => ({
  findActiveUserByEmail: async (email) =>
    prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        authProvider: true,
      },
    }),
  createLocalUserWithVerificationToken: async ({
    email,
    fullName,
    passwordHash,
    tokenHash,
    expiresAt,
  }) =>
    prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email,
          fullName,
          authProvider: "local",
          passwordHash,
          isVerified: false,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      });
      const verificationToken = await transaction.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        select: {
          id: true,
        },
      });

      return {
        user,
        verificationToken,
      };
    }),
});

export const createPrismaVerifyEmailRepository = ({
  prisma,
}: {
  prisma: PrismaClient;
}): VerifyEmailRepository => ({
  findEmailVerificationByHash: async (tokenHash) =>
    prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: {
            email: true,
            deletedAt: true,
          },
        },
      },
    }).then((record) =>
      record && record.user.deletedAt === null
        ? {
            id: record.id,
            userId: record.userId,
            email: record.user.email,
            expiresAt: record.expiresAt,
            usedAt: record.usedAt,
          }
        : null,
    ),
  consumeEmailVerificationToken: async ({ tokenId, userId, verifiedAt }) =>
    prisma.$transaction(async (transaction) => {
      const consumeResult = await transaction.emailVerificationToken.updateMany({
        where: {
          id: tokenId,
          userId,
          usedAt: null,
        },
        data: {
          usedAt: verifiedAt,
        },
      });

      if (consumeResult.count === 0) {
        return null;
      }

      const updateResult = await transaction.user.updateMany({
        where: {
          id: userId,
          deletedAt: null,
        },
        data: {
          isVerified: true,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      return transaction.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
        },
      });
    }),
});
