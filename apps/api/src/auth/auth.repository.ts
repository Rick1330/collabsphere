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
  createLocalUser: (input: {
    email: string;
    fullName: string;
    passwordHash: string;
  }) => Promise<CreatedAuthUser>;
  createEmailVerificationToken: (input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) => Promise<CreatedVerificationToken>;
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
  createLocalUser: async ({ email, fullName, passwordHash }) =>
    prisma.user.create({
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
    }),
  createEmailVerificationToken: async ({ userId, tokenHash, expiresAt }) =>
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
      },
    }),
});
