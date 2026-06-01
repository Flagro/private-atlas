"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  correlationSuffixFromApiBody,
  fallbackMessage,
} from "@/lib/api-errors";
import { useToast } from "@/components/providers/toast-provider";

type ImportMergeMode = "add" | "replace";

type ImportResult = {
  dryRun: boolean;
  mergeMode: ImportMergeMode;
  totalRows: number;
  created: number;
  skipped: number;
  duplicatesSkipped: number;
  existingVisitsDeleted?: number;
  issues: { index: number; message: string }[];
  preview?: {
    index: number;
    visitedAt: string;
    countryCode: string | null;
    cityName: string | null;
    notes: string | null;
    status?: string;
  }[];
};

export function AccountSettings({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [mergeMode, setMergeMode] = useState<ImportMergeMode>("add");
  const [replaceAcknowledged, setReplaceAcknowledged] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailMatches =
    deleteEmailInput.trim().toLowerCase() === email.trim().toLowerCase();
  const canDelete = emailMatches && deleteAcknowledged;

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
      toast(
        format === "json"
          ? "Visits downloaded as JSON."
          : "Visits downloaded as CSV.",
        "success"
      );
    } finally {
      setExporting(null);
    }
  }

  async function runImport(dryRun: boolean) {
    setError(null);
    if (!importFile) {
      setError("Choose a JSON file exported from Private Atlas.");
      return;
    }

    if (dryRun) setDryRunLoading(true);
    else setImporting(true);

    try {
      const text = await importFile.text();
      const res = await fetch(
        `/api/visits/import?dryRun=${dryRun ? "1" : "0"}&mergeMode=${mergeMode}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: text,
        }
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          `${fallbackMessage(body, dryRun ? "Preview failed." : "Import failed.")}${correlationSuffixFromApiBody(body)}`
        );
        return;
      }

      const result = body as ImportResult;
      if (dryRun) {
        setImportPreview(result);
        const ready =
          result.preview?.filter((p) => p.status === "ready").length ??
          result.totalRows - result.skipped;
        const dupMsg =
          result.duplicatesSkipped > 0
            ? ` ${result.duplicatesSkipped} duplicate${result.duplicatesSkipped === 1 ? "" : "s"} skipped.`
            : "";
        const replaceMsg =
          result.mergeMode === "replace" && result.existingVisitsDeleted != null
            ? ` Would remove ${result.existingVisitsDeleted} existing visit${result.existingVisitsDeleted === 1 ? "" : "s"} first.`
            : "";
        toast(
          ready > 0
            ? `Preview: ${ready} visit${ready === 1 ? "" : "s"} ready.${dupMsg}${replaceMsg}`
            : `Preview: nothing to import.${dupMsg}`,
          ready > 0 ? "success" : "error"
        );
      } else {
        setImportPreview(null);
        setImportFile(null);
        setReplaceAcknowledged(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        const parts = [`Imported ${result.created} visit${result.created === 1 ? "" : "s"}.`];
        if (result.duplicatesSkipped > 0) {
          parts.push(`${result.duplicatesSkipped} duplicate${result.duplicatesSkipped === 1 ? "" : "s"} skipped.`);
        }
        if (result.existingVisitsDeleted != null && result.existingVisitsDeleted > 0) {
          parts.push(`Removed ${result.existingVisitsDeleted} previous visit${result.existingVisitsDeleted === 1 ? "" : "s"}.`);
        }
        toast(parts.join(" "), result.created > 0 ? "success" : "error");
        if (result.issues.length > 0) {
          setError("Some rows were skipped — see details below.");
          setImportPreview(result);
        }
      }
    } finally {
      if (dryRun) setDryRunLoading(false);
      else setImporting(false);
    }
  }

  async function changePassword() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          `${fallbackMessage(body, "Could not update password.")}${correlationSuffixFromApiBody(body)}`
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated.", "success");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function deleteAccount() {
    setError(null);
    if (!canDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteEmailInput.trim() }),
      });
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

      {hasPassword ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Password
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Update the password you use to sign in with email.
          </p>
          <div className="mt-4 max-w-md space-y-3">
            <label className="block text-sm text-zinc-700 dark:text-zinc-300">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="block text-sm text-zinc-700 dark:text-zinc-300">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="block text-sm text-zinc-700 dark:text-zinc-300">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <Button
              type="button"
              variant="accent"
              loading={passwordLoading}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              onClick={() => void changePassword()}
            >
              Update password
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Password
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You sign in with Google. To add a password for email sign-in, use{" "}
            <Link href="/forgot-password" className="font-medium text-teal-700 dark:text-teal-400">
              forgot password
            </Link>{" "}
            with your account email (development shows the reset link on screen).
          </p>
        </section>
      )}

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
            onClick={() => void downloadExport("json")}
          >
            Download JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={exporting === "csv"}
            onClick={() => void downloadExport("csv")}
          >
            Download CSV
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Import visits
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Restore from a <span className="font-medium">JSON export</span> from this app. Preview
          first, then import. Duplicates (same country, city, and date) are skipped in add mode.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Import mode
          </legend>
          <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="radio"
              name="mergeMode"
              checked={mergeMode === "add"}
              onChange={() => {
                setMergeMode("add");
                setReplaceAcknowledged(false);
              }}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Add only</span> — keep
              existing visits; skip duplicates.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="radio"
              name="mergeMode"
              checked={mergeMode === "replace"}
              onChange={() => setMergeMode("replace")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Replace all</span> —
              delete every visit, then import the file.
            </span>
          </label>
        </fieldset>
        {mergeMode === "replace" ? (
          <label className="mt-3 flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              checked={replaceAcknowledged}
              onChange={(e) => setReplaceAcknowledged(e.target.checked)}
              className="mt-1"
            />
            I understand this will remove all my current visits before importing.
          </label>
        ) : null}
        <div className="mt-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="block w-full max-w-md text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-900 dark:text-zinc-400 dark:file:bg-teal-950/50 dark:file:text-teal-100"
            onChange={(e) => {
              setImportPreview(null);
              setImportFile(e.target.files?.[0] ?? null);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              loading={dryRunLoading}
              disabled={!importFile || importing}
              onClick={() => void runImport(true)}
            >
              Preview import
            </Button>
            <Button
              type="button"
              variant="accent"
              loading={importing}
              disabled={
                !importFile ||
                dryRunLoading ||
                (mergeMode === "replace" && !replaceAcknowledged)
              }
              onClick={() => void runImport(false)}
            >
              Import visits
            </Button>
          </div>
        </div>
        {importPreview && importPreview.issues.length > 0 ? (
          <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-800 dark:text-amber-200">
            {importPreview.issues.map((issue) => (
              <li key={issue.index}>
                Row {issue.index + 1}: {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        {importPreview &&
        importPreview.preview &&
        importPreview.preview.length > 0 &&
        importPreview.dryRun ? (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            First ready row: {importPreview.preview[0]!.countryCode ?? "—"} /{" "}
            {importPreview.preview[0]!.cityName ?? "—"} on{" "}
            {importPreview.preview[0]!.visitedAt}
          </p>
        ) : null}
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
        <label className="mt-4 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={deleteAcknowledged}
            onChange={(e) => setDeleteAcknowledged(e.target.checked)}
            className="mt-1 rounded border-zinc-300"
          />
          <span>I understand this will permanently delete my account and all visit data.</span>
        </label>
        <label className="mt-4 block text-sm text-zinc-700 dark:text-zinc-300">
          Type your account email to confirm
          <input
            type="email"
            value={deleteEmailInput}
            onChange={(e) => setDeleteEmailInput(e.target.value)}
            autoComplete="off"
            placeholder={email}
            className="mt-2 block w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          loading={deleting}
          disabled={!canDelete}
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
