import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

// Routes that are public (no auth required)
const PUBLIC_ROUTES = ["/", "/login", "/register"];

// Routes that only need auth + store selection (not employee PIN)
const STORE_ONLY_ROUTES = ["/select-store", "/select-employee", "/onboarding"];

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Always allow API routes, static assets, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // static files (favicon, sw.js, icons, etc.)
    pathname.startsWith("/receipt") // public receipt page
  ) {
    return NextResponse.next();
  }

  // 1. No session cookie → only allow public routes
  if (!sessionCookie) {
    if (PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Has session cookie → don't allow login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/select-store", request.url));
  }

  // 3. Has session cookie → allow public landing page
  if (pathname === "/") {
    // Authenticated users on landing page → redirect to select-store
    return NextResponse.redirect(new URL("/select-store", request.url));
  }

  // 4. Allow store-only routes (select-store, select-employee, onboarding)
  if (STORE_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 5. For all dashboard routes, just let them through
  //    (server components will validate store & employee context)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
