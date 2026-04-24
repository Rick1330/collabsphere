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

interface WorkspaceIdentifier {
  workspaceId: string;
}

interface CreateStoredWorkspaceInput
  extends Omit<StoredWorkspace, "id" | "createdAt" | "lastAccessedAt" | "status" | "roleLabel"> {
  id?: string;
  roleLabel?: string;
}

interface WorkspaceStatusUpdate extends WorkspaceIdentifier {
  status: StoredWorkspaceStatus;
}

const STORAGE_KEY = "collabsphere.workspaces.v1";

const listeners = new Set<() => void>();

const isBrowser = typeof window !== "undefined";

const isSlugCharacter = ({ character }: { character: string }) =>
  (character >= "a" && character <= "z") || (character >= "0" && character <= "9");

const trimTrailingDashes = ({ value }: { value: string }) => {
  let end = value.length;

  while (end > 0 && value[end - 1] === "-") {
    end -= 1;
  }

  return value.slice(0, end);
};

const slugify = ({ name }: { name: string }) => {
  const normalized = name.toLowerCase().trim();
  let slug = "";
  let previousWasDash = false;

  for (const character of normalized) {
    if (slug.length >= 40) {
      break;
    }

    if (isSlugCharacter({ character })) {
      slug += character;
      previousWasDash = false;
      continue;
    }

    if (slug.length === 0 || previousWasDash) {
      continue;
    }

    slug += "-";
    previousWasDash = true;
  }

  return trimTrailingDashes({ value: slug }) || "workspace";
};

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
  getById({ workspaceId }: WorkspaceIdentifier): StoredWorkspace | undefined {
    return cache.find((workspace) => workspace.id === workspaceId);
  },
  create(input: CreateStoredWorkspaceInput): StoredWorkspace {
    const baseSlug = input.id || slugify({ name: input.name });
    const existing = new Set(cache.map((workspace) => workspace.id));
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
  touch({ workspaceId }: WorkspaceIdentifier) {
    const idx = cache.findIndex((workspace) => workspace.id === workspaceId);
    if (idx === -1) return;
    cache = [...cache];
    cache[idx] = { ...cache[idx], lastAccessedAt: new Date().toISOString() };
    write(cache);
  },
  setStatus({ workspaceId, status }: WorkspaceStatusUpdate) {
    const idx = cache.findIndex((workspace) => workspace.id === workspaceId);
    if (idx === -1) return;
    cache = [...cache];
    cache[idx] = { ...cache[idx], status };
    write(cache);
  },
  remove({ workspaceId }: WorkspaceIdentifier) {
    cache = cache.filter((workspace) => workspace.id !== workspaceId);
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
