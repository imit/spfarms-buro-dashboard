import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isAuthPage = request.nextUrl.pathname === "/";
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  // If user is on auth page and has token, redirect to admin
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // If user is trying to access admin without token, redirect to login
  if (isAdmin && !token) {
    // Note: Since we're using localStorage for token storage,
    // this middleware won't have access to it. We'll handle
    // client-side protection in the admin pages.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
