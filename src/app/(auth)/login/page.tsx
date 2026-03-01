import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const params = await searchParams;
  const showRegisteredMessage = params.registered === "1";
  const hasError = params.error === "CredentialsSignin";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to your Private Atlas account
          </p>
        </div>

        <LoginForm
          showRegisteredMessage={showRegisteredMessage}
          hasError={hasError}
        />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
