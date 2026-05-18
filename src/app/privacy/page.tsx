import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy notes for Private Atlas.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="text-teal-700 hover:underline dark:text-teal-400">
          ← Home
        </Link>
      </p>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Privacy
      </h1>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          Private Atlas is a personal travel log. This page summarizes what the app does with your
          information in plain language—not legal advice.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Account and sign-in
        </h2>
        <p>
          If you create an account or sign in with Google, we store the minimum needed to
          authenticate you (for example, email and a secure password hash for email/password
          sign-in, or identifiers provided by the OAuth provider). Session cookies are used to keep
          you signed in.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your visit data
        </h2>
        <p>
          Visits you add (places, dates, notes) are stored in our database and tied to your
          account. They are used only to show your map and lists inside the app.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Deletion
        </h2>
        <p>
          You can delete your account from{" "}
          <Link href="/dashboard/settings" className="text-teal-700 hover:underline dark:text-teal-400">
            Settings
          </Link>
          . That removes your profile and related visit data from this application&apos;s database,
          subject to normal backups and retention policies of the hosting provider.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Contact
        </h2>
        <p>
          This is a private project. For questions about data in a deployed instance, contact the
          operator of that deployment.
        </p>
      </div>
    </div>
  );
}
