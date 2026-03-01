import { signIn } from "@/auth";

interface LoginFormProps {
  showRegisteredMessage?: boolean;
  hasError?: boolean;
}

export function LoginForm({
  showRegisteredMessage,
  hasError,
}: LoginFormProps) {
  return (
    <form
      className="space-y-6"
      action={async (formData) => {
        "use server";
        await signIn("credentials", {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          redirectTo: "/dashboard",
        });
      }}
    >
      {showRegisteredMessage && (
        <div
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
        >
          Account created! Sign in to continue.
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

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Sign in
      </button>
    </form>
  );
}
