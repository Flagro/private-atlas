import Link from "next/link";
import type { Metadata } from "next";
import { OAuthButtons, AuthDivider } from "@/components/auth/oauth-buttons";
import { RegisterForm } from "./register-form";
import { sanitizePostLoginRedirect } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = sanitizePostLoginRedirect(params.callbackUrl);
  const loginHref =
    redirectTo === "/dashboard"
      ? "/login"
      : `/login?callbackUrl=${encodeURIComponent(redirectTo)}`;

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-teal-50/40 px-4 py-12 outline-none dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/30"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/20">
          <div className="text-center">
            <p className="text-3xl" aria-hidden>
              🌍
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create an account
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Start tracking your travels with Private Atlas
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <OAuthButtons redirectTo={redirectTo} />
            <AuthDivider />
            <RegisterForm postLoginRedirect={redirectTo} />
          </div>
        </div>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-semibold text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
