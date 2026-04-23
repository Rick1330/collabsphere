// Lightweight localStorage-backed store for user-created workspaces.
// Keeps the demo app feeling real: workspaces created in the wizard
// persist across reloads, show up in the list, and open their own home page.

import { useSyncExternalStore } from "react";

export type StoredWorkspaceType = "professional" | "academic" | "general";
export type StoredWorkspaceStatus = "active" | "archived";

export interface StoredWorkspace {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: StoredWorkspaceType;
  status: StoredWorkspaceStatus;
  templateId: string | null;
  templateName: string | null;
  roleLabel: string;
  createdAt: string;
  lastAccessedAt: string;
}

const STORAGE_KEY = "collabsphere.workspaces.v1";

const listeners = new Set<() => void>();

const isBrowser = typeof window !== "undefined";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";

const read = (): StoredWorkspace[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (next: StoredWorkspace[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / serialization errors */
  }
  listeners.forEach((l) => l());
};

let cache: StoredWorkspace[] = read();

const refreshCache = () => {
  cache = read();
};

if (isBrowser) {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      refreshCache();
      listeners.forEach((l) => l());
    }
  });
}

export const workspaceStore = {
  getAll(): StoredWorkspace[] {
    return cache;
  },
  getById(id: string): StoredWorkspace | undefined {
    return cache.find((w) => w.id === id);
  },
  create(input: Omit<StoredWorkspace, "id" | "createdAt" | "lastAccessedAt" | "status" | "roleLabel"> & {
    id?: string;
    roleLabel?: string;
  }): StoredWorkspace {
    const baseSlug = input.id || slugify(input.name);
    const existing = new Set(cache.map((w) => w.id));
    let id = baseSlug;
    let n = 2;
    while (existing.has(id)) {
      id = `${baseSlug}-${n++}`;
    }
    const now = new Date().toISOString();
    const ws: StoredWorkspace = {
      id,
      name: input.name,
      description: input.description,
      icon: input.icon,
      type: input.type,
      templateId: input.templateId,
      templateName: input.templateName,
      roleLabel: input.roleLabel ?? "OWNER",
      status: "active",
      createdAt: now,
      lastAccessedAt: now,
    };
    cache = [ws, ...cache];
    write(cache);
    return ws;
  },
  touch(id: string) {
    const idx = cache.findIndex((w) => w.id === id);
    if (idx === -1) return;
    cache = [...cache];
    cache[idx] = { ...cache[idx], lastAccessedAt: new Date().toISOString() };
    write(cache);
  },
  setStatus(id: string, status: StoredWorkspaceStatus) {
    const idx = cache.findIndex((w) => w.id === id);
    if (idx === -1) return;
    cache = [...cache];
    cache[idx] = { ...cache[idx], status };
    write(cache);
  },
  remove(id: string) {
    cache = cache.filter((w) => w.id !== id);
    write(cache);
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useStoredWorkspaces(): StoredWorkspace[] {
  return useSyncExternalStore(
    workspaceStore.subscribe,
    workspaceStore.getAll,
    () => [],
  );
}
