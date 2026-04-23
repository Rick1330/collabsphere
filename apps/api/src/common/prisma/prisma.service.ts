import {
  createSoftDeletePrismaClient,
  type SoftDeleteClientControls,
} from "./soft-delete.middleware.js";
import { createWorkspaceScopedPrismaClient } from "./workspace-scope.js";

export type PrismaService<TClient extends object> = TClient & SoftDeleteClientControls<TClient>;

export const createPrismaService = <TClient extends object>(client: TClient): PrismaService<TClient> =>
  createSoftDeletePrismaClient(client);

export const withDeletedRecords = <TClient extends object>(client: PrismaService<TClient>) =>
  client.$withDeleted();

export const withHardDeletes = <TClient extends object>(client: PrismaService<TClient>) =>
  client.$withHardDeletes();

export const withWorkspaceScope = <TClient extends object>(client: TClient, workspaceId: string) =>
  createWorkspaceScopedPrismaClient(client, workspaceId);
