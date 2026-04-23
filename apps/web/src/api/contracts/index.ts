/**
 * Public API contracts (DTO-shaped types) consumed by the frontend.
 *
 * These types are the wire shape — what the backend returns. UI shapes
 * may differ; conversion between the two lives in src/api/adapters.
 *
 * Keep this file additive. Do not couple it to React or to feature code.
 */

export interface UserContract {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: "owner" | "admin" | "member" | "viewer";
}

export interface SessionContract {
  user: UserContract;
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO
}

export interface WorkspaceSummaryContract {
  id: string;
  slug: string;
  name: string;
  memberCount: number;
  updatedAt: string; // ISO
}
