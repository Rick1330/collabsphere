import { NextResponse, type NextRequest } from "next/server";

import {
  buildProtectedRouteRedirectUrl,
  getProtectedRouteScope,
} from "./lib/protected-route-boundary";

export function middleware(request: NextRequest) {
  const protectedScope = getProtectedRouteScope(request.nextUrl.pathname);

  if (!protectedScope) {
    return NextResponse.next();
  }

  // Until real session and RBAC wiring lands, non-public namespaces deny by default.
  return NextResponse.redirect(
    buildProtectedRouteRedirectUrl(request.nextUrl, protectedScope),
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
