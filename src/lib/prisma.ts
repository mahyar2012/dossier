import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { tenantExtension } from "@/lib/tenant-prisma";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makeClient> };

function makeClient() {
  const base = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  return base.$extends(tenantExtension());
}

function client() {
  globalForPrisma.prisma ??= makeClient();
  return globalForPrisma.prisma;
}

/**
 * Shared DB client. Tenant scoping applies when `runWithTenant` is active.
 */
export const prisma = new Proxy({} as ReturnType<typeof makeClient>, {
  get(_, key) {
    const target = client();
    const value = Reflect.get(target, key, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
