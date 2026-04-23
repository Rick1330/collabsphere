/**
 * Settings API adapter.
 *
 * Canonical surface for "my account" reads and writes consumed by the
 * settings pages: profile fetch/update, password change, and the
 * `UserProfile` type. Notification preferences live in the notifications
 * adapter so the inbox UI can share that surface.
 */
export {
  fetchCurrentUser,
  updateProfile,
  changePassword,
  type UserProfile,
  type AuthProvider,
} from "@/lib/mock-user";
