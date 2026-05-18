"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  correlationSuffixFromApiBody,
  fallbackMessage,
} from "@/lib/api-errors";

export function AccountSettings({ email }: { email: string }) {
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadExport(format: "json" | "csv") {
    setError(null);
    setExporting(format);
    try {
      const res = await fetch(`/api/visits/export?format=${format}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          `${fallbackMessage(body, "Export failed.")}${correlationSuffixFromApiBody(body)}`
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "json" ? "private-atlas-visits.json" : "private-atlas-visits.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function deleteAccount() {
    setError(null);
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE", credentials: "include" });
      if (res.status === 204) {
        await signOut({ callbackUrl: "/" });
        return;
      }
      const body = await res.json().catch(() => null);
      setError(
        `${fallbackMessage(body, "Could not delete account.")}${correlationSuffixFromApiBody(body)}`
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">{email}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Data export
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Download all visits you&apos;ve logged. Files are generated on demand from your account.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="accent"
            loading={exporting === "json"}
            onClick={() => downloadExport("json")}
          >
            Download JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={exporting === "csv"}
            onClick={() => downloadExport("csv")}
          >
            Download CSV
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Privacy
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          How we handle sign-in and visit data in this app.
        </p>
        <Link
          href="/privacy"
          className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          Privacy overview →
        </Link>
      </section>

      <section className="rounded-2xl border border-red-200/80 bg-red-50/40 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800 dark:text-red-300">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          Permanently delete your account and all visits. This cannot be undone.
        </p>
        <label className="mt-4 block text-sm text-zinc-700 dark:text-zinc-300">
          Type <span className="font-mono font-semibold text-red-700 dark:text-red-400">DELETE</span>{" "}
          to confirm
          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            autoComplete="off"
            className="mt-2 block w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder=""
          />
        </label>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          loading={deleting}
          disabled={deleteInput !== "DELETE"}
          onClick={() => void deleteAccount()}
        >
          Delete my account
        </Button>
      </section>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
