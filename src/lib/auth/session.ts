import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Nahal fork: sessions come from Clerk (same application as Cashly / other
 * *.nahal.app products). The upstream password JWE cookie is gone.
 */

/** A signed-in Clerk session, shaped for Dossier's existing call sites. */
export type Session = {
  /** Clerk user id (`user_…`). */
  userId: string;
  /** Display name / email hint for the sidebar when the profile name is empty. */
  label: string;
  /** Clerk sessions are persistent from Dossier's point of view. */
  persistent: boolean;
  issuedAt: Date;
  expiresAt: Date;
};

/**
 * The current session, or null when the request isn't signed in. Cached per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const user = await currentUser().catch(() => null);
  const label =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    userId;

  const iat = typeof sessionClaims?.iat === "number" ? sessionClaims.iat * 1000 : Date.now();
  const exp = typeof sessionClaims?.exp === "number" ? sessionClaims.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;

  return {
    userId,
    label,
    persistent: true,
    issuedAt: new Date(iat),
    expiresAt: new Date(exp),
  };
});

/**
 * The current session, for pages and layouts: sends the visitor to /login
 * when there is none.
 */
export async function verifySession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** No-op kept for call-site compatibility (Clerk manages cookies). */
export async function endSession(): Promise<void> {
  // Sign-out is handled by Clerk's <SignOutButton> / clerk.signOut().
}

/** @deprecated Password auth removed in the Nahal fork. */
export async function startSession(_opts: { persistent: boolean }): Promise<void> {
  throw new Error("Password sessions are disabled; use Clerk sign-in.");
}

/** @deprecated */
export function passwordMatches(_candidate: string): Promise<boolean> {
  return Promise.resolve(false);
}

/** Kept for connector/oauth fingerprint callers that still import the name. */
export function passwordFingerprint(): string {
  return "clerk";
}
