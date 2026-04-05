export type ProtectedRouteScope = "authenticated" | "workspace" | "admin";

type ProtectedRouteRule = {
  scope: ProtectedRouteScope;
  matches: (pathname: string) => boolean;
};

const GLOBAL_PROTECTED_PATHS = [
  "/dashboard",
  "/notifications",
  "/settings",
  "/workspaces",
] as const;

const PROTECTED_ROUTE_RULES: ProtectedRouteRule[] = [
  {
    scope: "admin",
    matches: (pathname) => pathname === "/admin" || pathname.startsWith("/admin/"),
  },
  {
    scope: "workspace",
    matches: (pathname) => pathname.startsWith("/w/"),
  },
  {
    scope: "authenticated",
    matches: (pathname) =>
      GLOBAL_PROTECTED_PATHS.some(
        (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
      ),
  },
];

export function getProtectedRouteScope(pathname: string): ProtectedRouteScope | null {
  for (const rule of PROTECTED_ROUTE_RULES) {
    if (rule.matches(pathname)) {
      return rule.scope;
    }
  }

  return null;
}

export function buildProtectedRouteRedirectUrl(
  sourceUrl: URL,
  scope: ProtectedRouteScope,
): URL {
  const loginUrl = new URL("/login", sourceUrl);
  loginUrl.searchParams.set("next", `${sourceUrl.pathname}${sourceUrl.search}`);
  loginUrl.searchParams.set("reason", scope);
  return loginUrl;
}
