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

export const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Partial<{ code: unknown }>;
  return candidate.code === "P2002";
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
