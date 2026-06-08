import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
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
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Enter your account email. We&apos;ll help you set a new password.
            </p>
          </div>
          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
        </div>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:underline dark:text-teal-400"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
