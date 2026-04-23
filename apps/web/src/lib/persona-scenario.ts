/**
 * Persona & Scenario store (dev/demo only).
 *
 * Exposes a small controlled mock control plane so the frontend can be
 * exercised across global roles, workspace roles, workspace types, and
 * key state scenarios without code edits. Backed by localStorage so
 * the choice persists across reloads. A `useSyncExternalStore` hook
 * lets components react to changes immediately.
 *
 * This is intentionally separate from `mock-user.ts` (the on-disk profile
 * record persisted via the Settings flow). The persona store is the
 * "who am I demoing as right now" lever.
 */

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type GlobalRole = "USER" | "ADMIN";

export type WorkspaceRoleKey =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "MEMBER"
  | "VIEWER"
  | "STUDENT"
  | "SUPERVISOR";

export type WorkspaceType = "professional" | "academic" | "general";

export type ScenarioState =
  | "active"
  | "archived"
  | "empty"
  | "dense"
  | "loading"
  | "error"
  | "readonly"
  | "submitted"
  | "changes_requested"
  | "approved";

export interface PersonaProfile {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  globalRole: GlobalRole;
  /** Default workspace persona this profile usually plays. */
  defaultWorkspaceRole: WorkspaceRoleKey;
}

export interface PersonaState {
  /** The current mock user profile. */
  profileId: string;
  /** The current workspace role they hold in the active workspace. */
  workspaceRole: WorkspaceRoleKey;
  /** Type of the workspace they're currently demoing. */
  workspaceType: WorkspaceType;
  /** Scenario state currently being demoed. */
  scenario: ScenarioState;
}

/* ------------------------------------------------------------------ */
/* Personas                                                           */
/* ------------------------------------------------------------------ */

export const PERSONAS: PersonaProfile[] = [
  {
    id: "u_jane",
    fullName: "Elshaday Tesfaye",
    email: "elshaday@collabsphere.app",
    initials: "ET",
    globalRole: "ADMIN",
    defaultWorkspaceRole: "OWNER",
  },
  {
    id: "u_eyob",
    fullName: "Eyob Bekele",
    email: "eyob@collabsphere.app",
    initials: "EB",
    globalRole: "USER",
    defaultWorkspaceRole: "MANAGER",
  },
  {
    id: "u_kidist",
    fullName: "Kidist Alemu",
    email: "kidist@collabsphere.app",
    initials: "KA",
    globalRole: "USER",
    defaultWorkspaceRole: "MEMBER",
  },
  {
    id: "u_yonas",
    fullName: "Yonas Girma",
    email: "yonas@collabsphere.app",
    initials: "YG",
    globalRole: "USER",
    defaultWorkspaceRole: "VIEWER",
  },
  {
    id: "u_meron",
    fullName: "Meron Hailu",
    email: "meron@university.edu",
    initials: "MH",
    globalRole: "USER",
    defaultWorkspaceRole: "STUDENT",
  },
  {
    id: "u_dawit",
    fullName: "Dawit Worku",
    email: "dawit@university.edu",
    initials: "DW",
    globalRole: "USER",
    defaultWorkspaceRole: "SUPERVISOR",
  },
];

export const WORKSPACE_ROLE_META: Record<
  WorkspaceRoleKey,
  { label: string; description: string }
> = {
  OWNER: { label: "Owner", description: "Full control of the workspace" },
  ADMIN: { label: "Admin", description: "Manage settings & members" },
  MANAGER: { label: "Manager", description: "Lead projects & assign work" },
  MEMBER: { label: "Member", description: "Create & contribute" },
  VIEWER: { label: "Viewer", description: "Read-only access" },
  STUDENT: { label: "Student", description: "Submit work for review" },
  SUPERVISOR: { label: "Supervisor", description: "Review submissions" },
};

export const WORKSPACE_TYPE_META: Record<
  WorkspaceType,
  { label: string; tone: string }
> = {
  professional: { label: "Professional", tone: "teal" },
  academic: { label: "Academic", tone: "amber" },
  general: { label: "General", tone: "stone" },
};

export const SCENARIO_META: Record<ScenarioState, { label: string; tone: string }> = {
  active: { label: "Active", tone: "emerald" },
  archived: { label: "Archived", tone: "stone" },
  empty: { label: "Empty", tone: "stone" },
  dense: { label: "Dense", tone: "indigo" },
  loading: { label: "Loading", tone: "blue" },
  error: { label: "Error", tone: "red" },
  readonly: { label: "Read-only", tone: "stone" },
  submitted: { label: "Submitted", tone: "amber" },
  changes_requested: { label: "Changes requested", tone: "red" },
  approved: { label: "Approved", tone: "emerald" },
};

/* ------------------------------------------------------------------ */
/* Storage / store                                                    */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "cs-persona-scenario";

const DEFAULT_STATE: PersonaState = {
  profileId: PERSONAS[0].id,
  workspaceRole: "OWNER",
  workspaceType: "professional",
  scenario: "active",
};

function readState(): PersonaState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(s: PersonaState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const listeners = new Set<() => void>();

let current: PersonaState = readState();

function emit() {
  for (const l of listeners) l();
}

export const personaStore = {
  get(): PersonaState {
    return current;
  },
  set(patch: Partial<PersonaState>) {
    current = { ...current, ...patch };
    writeState(current);
    emit();
  },
  reset() {
    current = DEFAULT_STATE;
    writeState(current);
    emit();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/* ------------------------------------------------------------------ */
/* Hooks                                                              */
/* ------------------------------------------------------------------ */

export function usePersonaState(): PersonaState {
  return useSyncExternalStore(
    personaStore.subscribe,
    () => current,
    () => DEFAULT_STATE,
  );
}

export function usePersonaProfile(): PersonaProfile {
  const { profileId } = usePersonaState();
  return PERSONAS.find((p) => p.id === profileId) ?? PERSONAS[0];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Convenience: derive the permission booleans the workspace pages already
 * consume from the current workspace role. Keeps a single source of truth.
 */
export function getRolePermissions(role: WorkspaceRoleKey): {
  canCreateContent: boolean;
  canEditSettings: boolean;
  canViewAnalytics: boolean;
  canReview: boolean;
} {
  switch (role) {
    case "OWNER":
    case "ADMIN":
      return {
        canCreateContent: true,
        canEditSettings: true,
        canViewAnalytics: true,
        canReview: true,
      };
    case "MANAGER":
    case "SUPERVISOR":
      return {
        canCreateContent: true,
        canEditSettings: false,
        canViewAnalytics: true,
        canReview: true,
      };
    case "MEMBER":
    case "STUDENT":
      return {
        canCreateContent: true,
        canEditSettings: false,
        canViewAnalytics: false,
        canReview: false,
      };
    case "VIEWER":
      return {
        canCreateContent: false,
        canEditSettings: false,
        canViewAnalytics: false,
        canReview: false,
      };
  }
}
