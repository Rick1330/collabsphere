/**
 * Auth API adapter (mock).
 *
 * Validates credentials against the seeded mock accounts and writes the
 * resulting session into `auth-session`. The adapter shape stays
 * close to a real backend so swapping to a fetch-based implementation
 * later is a one-file change.
 */

import type { SessionContract, UserContract } from "@/api/contracts";
import { authSession } from "@/lib/auth-session";
import { fetchCurrentUser, type UserProfile } from "@/lib/mock-user";
import { findAccountByEmail, MOCK_ACCOUNTS, type MockAccount } from "@/lib/mock-accounts";

export class AuthError extends Error {
  constructor(
    public readonly code:
      | "INVALID_CREDENTIALS"
      | "EMAIL_NOT_VERIFIED"
      | "ACCOUNT_DISABLED"
      | "PROVIDER_MISMATCH"
      | "EMAIL_TAKEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const FAKE_REFRESH = "mock-refresh-token";

function toUserContract(profile: UserProfile): UserContract {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    role: profile.globalRole === "ADMIN" ? "admin" : "member",
  };
}

function toSession(account: MockAccount): SessionContract {
  return {
    user: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      avatarUrl: account.avatarUrl,
      role: account.globalRole === "ADMIN" ? "admin" : "member",
    },
    accessToken: `mock-token-${account.id}-${Date.now()}`,
    refreshToken: FAKE_REFRESH,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const MOCK_ACCOUNTS_FALLBACK: MockAccount = MOCK_ACCOUNTS[0];

function validateLocalAccount(account: MockAccount | null, password: string): MockAccount {
  if (!account || account.password !== password) {
    throw new AuthError("INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  if (account.authProvider !== "local") {
    throw new AuthError(
      "PROVIDER_MISMATCH",
      `This account uses ${account.authProvider} sign-in. Use that provider to continue.`,
    );
  }
  if (account.status === "disabled") {
    throw new AuthError("ACCOUNT_DISABLED", "This account has been disabled. Contact your administrator.");
  }
  if (account.status === "unverified") {
    throw new AuthError("EMAIL_NOT_VERIFIED", "Verify your email address to sign in.");
  }
  return account;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<SessionContract> {
  await delay(450);
  const account = validateLocalAccount(findAccountByEmail(input.email), input.password);
  authSession.signIn(account.id);
  return toSession(account);
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<SessionContract> {
  await delay(500);
  const existing = findAccountByEmail(input.email);
  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "An account with that email already exists.");
  }
  // Mock registration does not persist a new account — it just returns the
  // first seeded account so downstream flows can continue. The UI shows the
  // "check your email" card as the success state.
  return toSession(MOCK_ACCOUNTS_FALLBACK);
}

export async function requestPasswordReset(_input: { email: string }): Promise<void> {
  await delay(250);
}

export async function resetPassword(_input: {
  token: string;
  password: string;
}): Promise<void> {
  await delay(250);
}

export async function verifyEmail(_token: string): Promise<{ verified: true }> {
  await delay(250);
  return { verified: true };
}

export async function getCurrentUser(): Promise<UserContract> {
  const profile = await fetchCurrentUser();
  return toUserContract(profile);
}

export async function logout(): Promise<void> {
  await delay(150);
  authSession.signOut();
}
