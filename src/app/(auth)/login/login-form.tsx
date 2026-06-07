import Link from "next/link";
import { signIn } from "@/auth";
import { OAuthButtons, AuthDivider } from "@/components/auth/oauth-buttons";
import { LoginCredentialFields } from "./login-credential-fields";
import { LoginSubmitButton } from "./submit-button";

interface LoginFormProps {
  showRegisteredMessage?: boolean;
  showPasswordResetMessage?: boolean;
  hasError?: boolean;
  hasOAuthError?: boolean;
  /** Sanitized path after sign-in (see `sanitizePostLoginRedirect`). */
  redirectTo?: string;
}

export function LoginForm({
  showRegisteredMessage,
  showPasswordResetMessage,
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

      {showPasswordResetMessage && (
        <div
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
        >
          Password updated. Sign in with your new password.
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
        <LoginCredentialFields />
        <p className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            Forgot password?
          </Link>
        </p>
        <LoginSubmitButton />
      </form>
    </div>
  );
}
