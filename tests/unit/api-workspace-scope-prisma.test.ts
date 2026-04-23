import assert from "node:assert/strict";
import test from "node:test";

import {
  addWorkspaceScopeWhere,
  assertMatchingWorkspaceId,
  createWorkspaceScopedPrismaClient,
  CROSS_WORKSPACE_WRITE_ERROR,
  MISSING_WORKSPACE_SCOPE_ERROR,
  normalizeWorkspaceScopedCreateArgs,
  normalizeWorkspaceScopedCreateManyArgs,
  normalizeWorkspaceScopedReadArgs,
  normalizeWorkspaceScopedUpdateManyArgs,
  requireWorkspaceId,
  UNSUPPORTED_WORKSPACE_UPSERT_ERROR,
} from "../../apps/api/src/common/prisma/workspace-scope.js";
import {
  createPrismaService,
  withDeletedRecords,
  withWorkspaceScope,
} from "../../apps/api/src/common/prisma/prisma.service.js";

test("workspace helpers reject empty scope values and mismatched cross-workspace writes", () => {
  assert.throws(() => requireWorkspaceId("  "), {
    message: MISSING_WORKSPACE_SCOPE_ERROR,
  });

  assert.throws(
    () =>
      assertMatchingWorkspaceId({
        expectedWorkspaceId: "ws_alpha",
        actualWorkspaceId: "ws_beta",
      }),
    {
      message: CROSS_WORKSPACE_WRITE_ERROR,
    },
  );
});

test("workspace scope normalizes where and create payloads", () => {
  assert.deepEqual(
    addWorkspaceScopeWhere({
      workspaceId: "ws_123",
      where: { status: "todo" },
    }),
    {
      AND: [{ status: "todo" }, { workspaceId: "ws_123" }],
    },
  );

  assert.deepEqual(
    normalizeWorkspaceScopedReadArgs({
      workspaceId: "ws_123",
      args: {
        where: { status: "todo" },
      },
    }),
    {
      where: {
        AND: [{ status: "todo" }, { workspaceId: "ws_123" }],
      },
    },
  );

  assert.deepEqual(
    normalizeWorkspaceScopedCreateArgs({
      workspaceId: "ws_123",
      args: {
        data: { title: "Scoped task" },
      },
    }),
    {
      data: {
        title: "Scoped task",
        workspaceId: "ws_123",
      },
    },
  );

  assert.deepEqual(
    normalizeWorkspaceScopedUpdateManyArgs({
      workspaceId: "ws_123",
      args: {
        where: { status: "todo" },
        data: { isRead: true },
      },
    }),
    {
      where: {
        AND: [{ status: "todo" }, { workspaceId: "ws_123" }],
      },
      data: {
        isRead: true,
      },
    },
  );
});

test("workspace scope rejects createMany payloads that try to cross workspace boundaries", () => {
  assert.throws(
    () =>
      normalizeWorkspaceScopedCreateManyArgs({
        workspaceId: "ws_123",
        args: {
          data: [
            { title: "valid row" },
            { title: "invalid row", workspaceId: "ws_other" },
          ],
        },
      }),
    {
      message: CROSS_WORKSPACE_WRITE_ERROR,
    },
  );
});

test("workspace-scoped reads compose with the default soft-delete filter", async () => {
  let capturedArgs: unknown;
  const baseClient = {
    task: {
      findMany: async (args?: unknown) => {
        capturedArgs = args;
        return [];
      },
    },
  };

  const prisma = createPrismaService(baseClient);

  await withWorkspaceScope(prisma, "ws_123").task.findMany({
    where: { status: "todo" },
  });

  assert.deepEqual(capturedArgs, {
    where: {
      AND: [
        {
          AND: [{ status: "todo" }, { workspaceId: "ws_123" }],
        },
        { deletedAt: null },
      ],
    },
  });
});

test("workspace-scoped findUnique delegates to findFirst so filters remain valid", async () => {
  const calls: Array<{ method: string; args: unknown }> = [];
  const baseClient = {
    task: {
      findUnique: async () => ({ id: "task_123" }),
      findFirst: async (args?: unknown) => {
        calls.push({ method: "findFirst", args });
        return { id: "task_123" };
      },
    },
  };

  const prisma = createPrismaService(baseClient);

  await withWorkspaceScope(prisma, "ws_123").task.findUnique({
    where: { id: "task_123" },
  });

  assert.deepEqual(calls, [
    {
      method: "findFirst",
      args: {
        where: {
          AND: [
            {
              AND: [{ id: "task_123" }, { workspaceId: "ws_123" }],
            },
            { deletedAt: null },
          ],
        },
      },
    },
  ]);
});

test("workspace-scoped create injects workspaceId and withDeleted preserves the scope", async () => {
  let createArgs: unknown;
  let withDeletedReadArgs: unknown;
  const baseClient = {
    task: {
      create: async (args?: unknown) => {
        createArgs = args;
        return { id: "task_123" };
      },
      findMany: async (args?: unknown) => {
        withDeletedReadArgs = args;
        return [];
      },
    },
  };

  const prisma = createPrismaService(baseClient);
  const scopedClient = withWorkspaceScope(prisma, "ws_123");

  await scopedClient.task.create({
    data: { title: "Scoped task" },
  });
  await withDeletedRecords(scopedClient).task.findMany({
    where: { status: "todo" },
  });

  assert.deepEqual(createArgs, {
    data: {
      title: "Scoped task",
      workspaceId: "ws_123",
    },
  });
  assert.deepEqual(withDeletedReadArgs, {
    where: {
      AND: [{ status: "todo" }, { workspaceId: "ws_123" }],
    },
  });
});

test("workspace-scoped unique mutations reject records outside the requested workspace", async () => {
  let updateCalled = false;
  const baseClient = {
    task: {
      findFirst: async () => null,
      update: async () => {
        updateCalled = true;
        return { id: "task_123" };
      },
    },
  };

  const prisma = createPrismaService(baseClient);

  await assert.rejects(
    withWorkspaceScope(prisma, "ws_123").task.update({
      where: { id: "task_123" },
      data: { title: "Updated task" },
    }),
    {
      message: "Workspace-scoped update() did not match an active record in workspace ws_123.",
    },
  );
  assert.equal(updateCalled, false);
});

test("workspace-scoped upsert is rejected until the call sites are split into explicit flows", () => {
  const scopedClient = createWorkspaceScopedPrismaClient(
    {
      task: {
        upsert: async () => ({ id: "task_123" }),
      },
    },
    "ws_123",
  );

  assert.throws(
    () =>
      scopedClient.task.upsert({
      where: { id: "task_123" },
      create: { title: "Scoped task" },
      update: { title: "Updated task" },
    }),
    {
      message: UNSUPPORTED_WORKSPACE_UPSERT_ERROR,
    },
  );
});
