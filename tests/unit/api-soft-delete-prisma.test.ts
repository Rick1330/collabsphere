import assert from "node:assert/strict";
import test from "node:test";

import {
  addDefaultSoftDeleteWhere,
  createSoftDeletePrismaClient,
  normalizeSoftDeleteDeleteArgs,
  normalizeSoftDeleteDeleteManyArgs,
  normalizeSoftDeleteReadArgs,
} from "../../apps/api/src/common/prisma/soft-delete.middleware.js";
import {
  createPrismaService,
  withDeletedRecords,
  withHardDeletes,
} from "../../apps/api/src/common/prisma/prisma.service.js";

const fixedDeletedAt = new Date("2026-04-24T12:00:00.000Z");
const fixedNow = () => fixedDeletedAt;

test("default read filter adds deletedAt null constraint when no override is used", () => {
  assert.deepEqual(
    addDefaultSoftDeleteWhere({
      where: { workspaceId: "ws_123" },
    }),
    {
      AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
    },
  );

  assert.deepEqual(
    normalizeSoftDeleteReadArgs({
      args: {
        where: { workspaceId: "ws_123" },
      },
    }),
    {
      where: {
        AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
      },
    },
  );
});

test("withDeleted override leaves read filters untouched for recovery flows", async () => {
  let capturedArgs: unknown;
  const baseClient = {
    user: {
      findMany: async (args?: unknown) => {
        capturedArgs = args;
        return [];
      },
    },
  };

  const prisma = createPrismaService(baseClient);

  await withDeletedRecords(prisma).user.findMany({
    where: {
      deletedAt: {
        not: null,
      },
    },
  });

  assert.deepEqual(capturedArgs, {
    where: {
      deletedAt: {
        not: null,
      },
    },
  });
});

test("findUnique delegates to findFirst so soft-delete filters stay valid", async () => {
  const calls: Array<{ method: string; args: unknown }> = [];
  const baseClient = {
    user: {
      findUnique: async (args?: unknown) => {
        calls.push({ method: "findUnique", args });
        return { id: "user_123" };
      },
      findFirst: async (args?: unknown) => {
        calls.push({ method: "findFirst", args });
        return { id: "user_123" };
      },
    },
  };

  const prisma = createPrismaService(baseClient);

  await prisma.user.findUnique({
    where: { id: "user_123" },
  });

  assert.deepEqual(calls, [
    {
      method: "findFirst",
      args: {
        where: {
          AND: [{ id: "user_123" }, { deletedAt: null }],
        },
      },
    },
  ]);
});

test("soft delete normalizes delete operations into update payloads", () => {
  assert.deepEqual(
    normalizeSoftDeleteDeleteArgs({
      args: {
        where: { id: "user_123" },
      },
      now: fixedNow,
    }),
    {
      where: { id: "user_123" },
      data: {
        deletedAt: fixedDeletedAt,
      },
    },
  );

  assert.deepEqual(
    normalizeSoftDeleteDeleteManyArgs({
      args: {
        where: { workspaceId: "ws_123" },
      },
      now: fixedNow,
    }),
    {
      where: {
        AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
      },
      data: {
        deletedAt: fixedDeletedAt,
      },
    },
  );
});

test("default client turns delete and deleteMany into soft-delete updates", async () => {
  const calls: Array<{ method: string; args: unknown }> = [];
  const baseClient = {
    user: {
      update: async (args?: unknown) => {
        calls.push({ method: "update", args });
        return { id: "user_123" };
      },
      updateMany: async (args?: unknown) => {
        calls.push({ method: "updateMany", args });
        return { count: 1 };
      },
      delete: async (args?: unknown) => {
        calls.push({ method: "delete", args });
        return { id: "user_123" };
      },
      deleteMany: async (args?: unknown) => {
        calls.push({ method: "deleteMany", args });
        return { count: 1 };
      },
    },
  };

  const prisma = createSoftDeletePrismaClient(baseClient, {
    now: fixedNow,
  });

  await prisma.user.delete({
    where: { id: "user_123" },
  });
  await prisma.user.deleteMany({
    where: { workspaceId: "ws_123" },
  });

  assert.deepEqual(calls, [
    {
      method: "update",
      args: {
        where: { id: "user_123" },
        data: {
          deletedAt: fixedDeletedAt,
        },
      },
    },
    {
      method: "updateMany",
      args: {
        where: {
          AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
        },
        data: {
          deletedAt: fixedDeletedAt,
        },
      },
    },
  ]);
});

test("purge client keeps hard deletes available while default client still filters reads", async () => {
  let defaultReadArgs: unknown;
  let purgeDeleteArgs: unknown;
  const baseClient = {
    user: {
      findMany: async (args?: unknown) => {
        defaultReadArgs = args;
        return [];
      },
      delete: async (args?: unknown) => {
        purgeDeleteArgs = args;
        return { id: "user_123" };
      },
    },
    auditLog: {
      findMany: async () => [],
    },
  };

  const prisma = createPrismaService(baseClient);

  await prisma.user.findMany({
    where: { workspaceId: "ws_123" },
  });
  await withHardDeletes(prisma).user.delete({
    where: { id: "user_123" },
  });

  assert.deepEqual(defaultReadArgs, {
    where: {
      AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
    },
  });
  assert.deepEqual(purgeDeleteArgs, {
    where: { id: "user_123" },
  });
});

test("withDeleted deleteMany still only targets active rows", async () => {
  let updateManyArgs: unknown;
  const baseClient = {
    user: {
      updateMany: async (args?: unknown) => {
        updateManyArgs = args;
        return { count: 1 };
      },
      deleteMany: async () => ({ count: 1 }),
    },
  };

  const prisma = createSoftDeletePrismaClient(baseClient, {
    now: fixedNow,
  });

  await prisma.$withDeleted().user.deleteMany({
    where: { workspaceId: "ws_123" },
  });

  assert.deepEqual(updateManyArgs, {
    where: {
      AND: [{ workspaceId: "ws_123" }, { deletedAt: null }],
    },
    data: {
      deletedAt: fixedDeletedAt,
    },
  });
});
