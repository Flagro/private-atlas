import { signIn } from "@/auth";
import { OAuthButtons, AuthDivider } from "@/components/auth/oauth-buttons";
import { LoginSubmitButton } from "./submit-button";

interface LoginFormProps {
  showRegisteredMessage?: boolean;
  hasError?: boolean;
  hasOAuthError?: boolean;
  /** Sanitized path after sign-in (see `sanitizePostLoginRedirect`). */
  redirectTo?: string;
}

export function LoginForm({
  showRegisteredMessage,
  hasError,
  hasOAuthError,
  redirectTo = "/dashboard",
}: LoginFormProps) {
  return (
    <div className="space-y-6">
      <OAuthButtons redirectTo={redirectTo} />

      <AuthDivider />

      {showRegisteredMessage && (
        <div
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
        >
          Account created! Sign in to continue.
        </div>
      )}

      {hasOAuthError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          Google sign-in failed. Please try again.
        </div>
      )}

      {hasError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          Invalid email or password.
        </div>
      )}

      <form
        className="space-y-5"
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirectTo,
          });
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            placeholder="••••••••"
          />
        </div>

        <LoginSubmitButton />
      </form>
    </div>
  );
}
