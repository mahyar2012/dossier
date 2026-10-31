"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/** Signs out of Clerk and returns to the login page. */
export async function signOut(): Promise<void> {
  const { sessionId } = await auth();
  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }
  redirect("/login");
}
