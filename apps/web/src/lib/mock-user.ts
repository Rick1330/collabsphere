/**
 * Profile/account adapter (mock).
 *
 * `fetchCurrentUser` reads the currently authenticated account from the
 * auth session. `updateProfile` mutates an in-memory overlay so settings
 * edits persist across reloads (per-account, keyed by id) without
 * altering the seeded credentials list.
 *
 * Treat this as the "my account" surface — `auth-session.ts` is the
 * source of truth for *who* is signed in, this module returns the
 * profile-shaped view that the settings/admin/UI surfaces consume.
 */

import { authSession } from "@/lib/auth-session";
import { findAccountById, MOCK_ACCOUNTS, type AuthProvider as AccountAuthProvider } from "@/lib/mock-accounts";

export type AuthProvider = AccountAuthProvider;

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  globalRole: "USER" | "ADMIN";
  authProvider: AuthProvider;
}

const OVERLAY_KEY = "cs-profile-overlay";

interface OverlayPatch {
  fullName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

type Overlay = Record<string, OverlayPatch>;

function readOverlay(): Overlay {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERLAY_KEY);
    return raw ? (JSON.parse(raw) as Overlay) : {};
  } catch {
    return {};
  }
}

function writeOverlay(o: Overlay) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERLAY_KEY, JSON.stringify(o));
}

const FALLBACK: UserProfile = {
  id: MOCK_ACCOUNTS[0].id,
  fullName: MOCK_ACCOUNTS[0].fullName,
  email: MOCK_ACCOUNTS[0].email,
  bio: MOCK_ACCOUNTS[0].bio,
  avatarUrl: MOCK_ACCOUNTS[0].avatarUrl,
  globalRole: MOCK_ACCOUNTS[0].globalRole,
  authProvider: MOCK_ACCOUNTS[0].authProvider,
};

function buildProfile(accountId: string | null): UserProfile {
  if (!accountId) return FALLBACK;
  const account = findAccountById(accountId);
  if (!account) return FALLBACK;
  const overlay = readOverlay()[accountId] ?? {};
  return {
    id: account.id,
    fullName: overlay.fullName ?? account.fullName,
    email: account.email,
    bio: overlay.bio !== undefined ? overlay.bio : account.bio,
    avatarUrl: overlay.avatarUrl !== undefined ? overlay.avatarUrl : account.avatarUrl,
    globalRole: account.globalRole,
    authProvider: account.authProvider,
  };
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function fetchCurrentUser(): Promise<UserProfile> {
  await delay(150);
  const session = authSession.get();
  return buildProfile(session?.accountId ?? null);
}

export async function updateProfile(params: {
  fullName: string;
  bio?: string;
}): Promise<UserProfile> {
  await delay(350);
  const session = authSession.get();
  if (!session) throw new Error("Not authenticated");

  const overlay = readOverlay();
  const next: OverlayPatch = {
    ...overlay[session.accountId],
    fullName: params.fullName,
    bio: params.bio?.trim() ? params.bio.trim() : null,
  };
  overlay[session.accountId] = next;
  writeOverlay(overlay);
  authSession.touch();
  return buildProfile(session.accountId);
}

export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await delay(500);
  const account = authSession.getAccount();
  if (!account) throw new Error("Not authenticated");
  if (params.currentPassword !== account.password) {
    const err = new Error("Invalid credentials");
    (err as Error & { code: string }).code = "INVALID_CREDENTIALS";
    throw err;
  }
  // In the mock world, we accept the new password silently.
}
