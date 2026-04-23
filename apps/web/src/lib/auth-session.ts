/**
 * Mock auth session store.
 *
 * Source of truth for "who is signed in right now". Persisted to
 * localStorage so reloads keep the session, and exposed as a
 * `useSyncExternalStore` hook so React components react instantly to
 * sign-in / sign-out / profile-update events.
 *
 * The session is intentionally minimal: an account id + a fake token +
 * an issued-at timestamp. Profile data is looked up from `mock-accounts`
 * when needed so a single source of truth stays canonical.
 */

import { useSyncExternalStore } from "react";
import { findAccountById, type MockAccount } from "@/lib/mock-accounts";

const STORAGE_KEY = "cs-auth-session";

export interface AuthSession {
  accountId: string;
  accessToken: string;
  issuedAt: string; // ISO
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accountId || !findAccountById(parsed.accountId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(s: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

let current: AuthSession | null = readSession();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const authSession = {
  get(): AuthSession | null {
    return current;
  },
  getAccount(): MockAccount | null {
    if (!current) return null;
    return findAccountById(current.accountId) ?? null;
  },
  signIn(accountId: string) {
    current = {
      accountId,
      accessToken: `mock-token-${accountId}-${Date.now()}`,
      issuedAt: new Date().toISOString(),
    };
    writeSession(current);
    emit();
  },
  signOut() {
    current = null;
    writeSession(null);
    emit();
  },
  /** Notify subscribers when the underlying account record changes (e.g. profile update). */
  touch() {
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

export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(
    authSession.subscribe,
    () => current,
    () => null,
  );
}

export function useCurrentAccount(): MockAccount | null {
  const session = useAuthSession();
  if (!session) return null;
  return findAccountById(session.accountId) ?? null;
}

export function useIsAuthenticated(): boolean {
  return useAuthSession() !== null;
}
