import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { TENANT_MODELS } from "@/lib/tenant";

const root = path.join(import.meta.dirname, "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "generated" || name === "node_modules") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("tenancy wiring", () => {
  it("lists the expected tenant models", () => {
    expect(TENANT_MODELS.has("Application")).toBe(true);
    expect(TENANT_MODELS.has("Setting")).toBe(true);
    expect(TENANT_MODELS.has("Startup")).toBe(false);
  });

  it("keeps action() and route() wrapped in runWithTenant", () => {
    const action = readFileSync(path.join(root, "lib/action.ts"), "utf8");
    const route = readFileSync(path.join(root, "lib/route.ts"), "utf8");
    expect(action).toContain("runWithTenant");
    expect(route).toContain("runWithTenant");
  });

  it("does not reintroduce DOSSIER_PASSWORD in env", () => {
    const env = readFileSync(path.join(root, "lib/env.ts"), "utf8");
    expect(env).not.toMatch(/DOSSIER_PASSWORD/);
    expect(env).toContain("CLERK_SECRET_KEY");
  });
});
