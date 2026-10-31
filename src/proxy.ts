import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { contentSecurityPolicy, createNonce } from "@/lib/csp";
import { messages } from "@/lib/messages";
import { PRINT_TOKEN_HEADER, verifyPrintToken } from "@/lib/pdf/print-token";

/** The Claude connector's endpoint, its sign-in and the metadata that points to them. */
const CONNECTOR_PATHS = /^\/(?:api\/(?:mcp|oauth)(?:\/|$)|\.well-known\/oauth-(?:authorization-server|protected-resource)(?:\/|$))/;

const isPublic = createRouteMatcher([
  "/login(.*)",
  "/api/health(.*)",
  "/api/mcp(.*)",
  "/api/oauth(.*)",
  "/.well-known/(.*)",
]);

/**
 * Clerk auth gate + Content-Security-Policy (E11-5). Pages, layouts, actions
 * and route handlers still check the session themselves.
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname, search } = request.nextUrl;

  if (CONNECTOR_PATHS.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/print/")) {
    if (await verifyPrintToken(request.headers.get(PRINT_TOKEN_HEADER), pathname)) {
      return withCsp(request);
    }
  }

  if (!isPublic(request)) {
    const { userId } = await auth();
    if (!userId) {
      if (request.headers.has("next-action")) return withCsp(request);
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: messages.signedOut }, { status: 401 });
      }
      const login = new URL("/login", request.url);
      if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
  }

  return withCsp(request);
});

function withCsp(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
    request.nextUrl.protocol.replace(/:$/, "");
  const policy = contentSecurityPolicy(createNonce(), {
    dev: process.env.NODE_ENV === "development",
    https: protocol === "https",
  });
  const headers = new Headers(request.headers);
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static/|_next/image|_next/hmr|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
