import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isAuthPage = request.nextUrl.pathname === "/";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // If user is on auth page and has token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is trying to access dashboard without token, redirect to login
  if (isDashboard && !token) {
    // Note: Since we're using localStorage for token storage,
    // this middleware won't have access to it. We'll handle
    // client-side protection in the dashboard page.
    // This is here for future cookie-based auth if needed.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
