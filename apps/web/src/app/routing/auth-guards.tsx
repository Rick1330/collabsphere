/**
 * Route guards.
 *
 * `RequireAuth` redirects unauthenticated visitors to `/login` (preserving
 * the originally-requested URL via the `next` query param).
 *
 * `RedirectIfAuthed` bounces signed-in users away from auth pages
 * (login/register/forgot/reset) so they don't see them once authenticated.
 *
 * Admin gating still lives in `AdminGuard` which checks the resolved
 * profile's `globalRole`.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAuthenticated } from "@/lib/auth-session";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const isAuthed = useIsAuthenticated();
  const location = useLocation();
  if (!isAuthed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
};

export const RedirectIfAuthed = ({
  children,
  to = "/dashboard",
}: {
  children: ReactNode;
  to?: string;
}) => {
  const isAuthed = useIsAuthenticated();
  if (isAuthed) return <Navigate to={to} replace />;
  return <>{children}</>;
};
