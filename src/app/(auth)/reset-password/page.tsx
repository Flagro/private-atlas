import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-teal-50/40 px-4 py-12 outline-none dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/30"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Choose a new password
            </h1>
          </div>
          <div className="mt-8">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                Missing reset token. Request a new link from{" "}
                <Link href="/forgot-password" className="font-medium underline">
                  forgot password
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
