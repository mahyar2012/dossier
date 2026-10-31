import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

/** Clerk sign-in (Nahal fork) — same Clerk application as other *.nahal.app products. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;
  const dest = typeof next === "string" && next.startsWith("/") ? next : "/";

  return (
    <main className="grid min-h-screen bg-surface min-[960px]:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col items-start gap-2">
            <BrandMark className="size-10" />
            <div className="flex flex-col">
              <div className="font-serif text-[30px] font-medium tracking-[-0.01em]">Dossier</div>
              <div className="text-sm text-muted">Your job search, on Nahal</div>
            </div>
          </div>
          <SignIn
            routing="hash"
            forceRedirectUrl={dest}
            signUpForceRedirectUrl={dest}
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-black/10",
              },
            }}
          />
          <p className="text-meta leading-[1.6] text-pretty text-muted">
            Sign in with your Nahal account (same login as Cashly and other Nahal apps).
            AI and job-search API keys are yours to enter in Settings — Nahal does not share a platform key.
          </p>
          <p className="text-meta leading-[1.6] text-pretty text-muted">
            Source (AGPL-3.0):{" "}
            <a className="underline" href="https://github.com/mahyar2012/dossier">
              github.com/mahyar2012/dossier
            </a>
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="hidden bg-[linear-gradient(to_left,color-mix(in_srgb,var(--color-ink)_9%,transparent)_0%,transparent_65%)] min-[960px]:grid min-[960px]:place-items-center"
      >
        <BrandMark className="size-40 opacity-90 shadow-dialog rounded-[36px]" />
      </div>
    </main>
  );
}
