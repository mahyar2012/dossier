import "server-only";

import { Prisma } from "@/generated/prisma/client";

import { currentTenantId, TENANT_MODELS } from "@/lib/tenant";

type Args = {
  model?: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => Promise<unknown>;
};

function withTenantWhere(args: Record<string, unknown>, userId: string, model?: string): Record<string, unknown> {
  const where = (args.where as Record<string, unknown> | undefined) ?? {};
  if (where.clerkUserId !== undefined || where.OR) return args;
  // Built-in themes are shared (clerkUserId null); user themes are scoped.
  if (model === "Theme") {
    return { ...args, where: { ...where, OR: [{ clerkUserId: userId }, { builtIn: true }] } };
  }
  return { ...args, where: { ...where, clerkUserId: userId } };
}

function withTenantData(args: Record<string, unknown>, userId: string): Record<string, unknown> {
  const data = args.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const row = data as Record<string, unknown>;
    if (row.clerkUserId === undefined) {
      args = { ...args, data: { ...row, clerkUserId: userId } };
    }
  }
  if (Array.isArray(data)) {
    args = {
      ...args,
      data: data.map((row) =>
        row && typeof row === "object" && (row as Record<string, unknown>).clerkUserId === undefined
          ? { ...(row as object), clerkUserId: userId }
          : row,
      ),
    };
  }
  return args;
}

/** Rewrite ProfileField / Setting findUnique({ where: { key } }) to composite id. */
function rewriteCompositeKey(model: string, args: Record<string, unknown>, userId: string): Record<string, unknown> {
  if (model !== "ProfileField" && model !== "Setting") return args;
  const where = args.where as Record<string, unknown> | undefined;
  if (!where || where.clerkUserId_key || where.clerkUserId) return args;
  if (typeof where.key === "string") {
    return { ...args, where: { clerkUserId_key: { clerkUserId: userId, key: where.key } } };
  }
  return args;
}

/**
 * Prisma client extension: when AsyncLocalStorage has a tenant, auto-scope
 * TENANT_MODELS queries and creates by clerkUserId.
 */
export function tenantExtension() {
  return Prisma.defineExtension({
    name: "nahal-tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: Args) {
          const userId = currentTenantId();
          if (!userId || !model || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          let next = { ...args } as Record<string, unknown>;
          next = rewriteCompositeKey(model, next, userId);

          switch (operation) {
            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany":
              next = withTenantWhere(next, userId, model);
              break;
            case "create":
            case "createMany":
              next = withTenantData(next, userId);
              break;
            case "upsert": {
              next = withTenantWhere(next, userId, model);
              const create = next.create as Record<string, unknown> | undefined;
              if (create && create.clerkUserId === undefined) {
                next = { ...next, create: { ...create, clerkUserId: userId } };
              }
              const update = next.update as Record<string, unknown> | undefined;
              if (update && "clerkUserId" in update) {
                const { clerkUserId: _drop, ...rest } = update;
                next = { ...next, update: rest };
              }
              break;
            }
            default:
              break;
          }

          return query(next);
        },
      },
    },
  });
}
