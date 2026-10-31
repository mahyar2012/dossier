# Nahal fork notes

This is a public AGPL-3.0 fork of [AienTech/dossier](https://github.com/AienTech/dossier) for hosting at **https://dossier.nahal.app**.

## Changes vs upstream

- **Auth:** Clerk (shared Nahal application) instead of `DOSSIER_PASSWORD`.
- **Multi-tenant:** `clerkUserId` on user-owned rows; Prisma extension auto-scopes when `runWithTenant` is active.
- **BYOK:** AI / job-search API keys stay per-user in Settings (no shared Nahal platform key in production).
- **CSP:** Clerk Frontend API hosts allowlisted alongside the upstream nonce policy.
- **Startup catalog:** shared `Startup` rows; per-user state in `StartupUserState`.

## Deploy

See Nahal monorepo: `documents/platform/runbooks/deploy/dossier.md` and `.github/workflows/deploy-dossier-vps.yml`.

## Source offer (AGPL §13)

Corresponding source for the running build: this repository (`nahal/clerk-multitenant` branch or the tagged deploy commit). Also linked from the sign-in page.
