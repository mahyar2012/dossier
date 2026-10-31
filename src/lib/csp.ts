// The Content-Security-Policy every page gets (E11-5), set by the proxy with
// a fresh nonce per request. Next.js reads the nonce from the request's copy
// of the header and puts it on its own scripts, so pages have to render per
// request (the root layout waits for the connection).
//
// Nahal fork: Clerk Frontend API hosts are allowlisted so sign-in scripts and
// API calls work under the same nonce policy.

/** 128 random bits, base64. */
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/** Clerk script/connect/frame hosts for the shared Nahal Clerk application. */
export const CLERK_CSP_HOSTS = [
  "https://*.clerk.accounts.dev",
  "https://clerk.nahal.app",
  "https://*.clerk.nahal.app",
  "https://clerk.com",
  "https://*.clerk.com",
  "https://challenges.cloudflare.com",
].join(" ");

/**
 * Scripts only with this request's nonce ('strict-dynamic' lets them load the
 * rest); styles may be inline, since React renders style attributes, which a
 * nonce can't cover. Clerk hosts are allowlisted for the Nahal fork. Nothing
 * else loads from other hosts, and no other site may frame Dossier.
 */
export function contentSecurityPolicy(nonce: string, { dev = false, https = false }: { dev?: boolean; https?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${CLERK_CSP_HOSTS}${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://img.clerk.com https://*.clerk.com",
    "font-src 'self'",
    `connect-src 'self' ${CLERK_CSP_HOSTS}`,
    `frame-src 'self' ${CLERK_CSP_HOSTS}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
