import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-semibold">
          Welcome, {session.user.name ?? session.user.email}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your travel dashboard is coming soon. Stay tuned!
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
