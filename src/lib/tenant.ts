import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import { getSession, type Session } from "@/lib/auth/session";

const storage = new AsyncLocalStorage<string>();

/** Models that carry clerkUserId and must be scoped per Clerk user. */
export const TENANT_MODELS = new Set([
  "ProfileField",
  "Skill",
  "Language",
  "Experience",
  "Project",
  "Education",
  "Publication",
  "Reference",
  "Fact",
  "Theme",
  "Setting",
  "Application",
  "StatusEvent",
  "Document",
  "DocumentVersion",
  "ChatMessage",
  "Note",
  "Posting",
  "ClaudePaste",
  "AgentCandidate",
  "PostingScore",
  "PostingSearch",
  "StartupUserState",
  "StartupBlock",
  "GoogleAccount",
  "EmailMessage",
  "Job",
]);

/** Shared catalog / infra models — not auto-scoped by clerkUserId. */
export const SHARED_MODELS = new Set(["Startup", "LoginThrottle"]);

export function runWithTenant<T>(clerkUserId: string, fn: () => T): T {
  return storage.run(clerkUserId, fn);
}

export function currentTenantId(): string | undefined {
  return storage.getStore();
}

export function requireTenantId(): string {
  const id = storage.getStore();
  if (!id) throw new Error("No tenant in AsyncLocalStorage — call runWithTenant or requireSessionTenant first");
  return id;
}

/** Bind the Clerk user from the current session into ALS for the rest of the call. */
export async function requireSessionTenant(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("signed out");
  // Caller should already be inside runWithTenant from action()/route()/layout.
  if (!storage.getStore()) {
    storage.enterWith(session.userId);
  }
  return session;
}
