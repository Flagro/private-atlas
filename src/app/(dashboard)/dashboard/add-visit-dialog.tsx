"use client";

import { useEffect, useState } from "react";
import type { CityOption, CountryOption, VisitWithRelations } from "@/types";
import { todayAsDateString } from "@/lib/utils";

interface AddVisitDialogProps {
  isOpen: boolean;
  countries: CountryOption[];
  onClose: () => void;
  onAdd: (visit: VisitWithRelations) => void;
}

export function AddVisitDialog({
  isOpen,
  countries,
  onClose,
  onAdd,
}: AddVisitDialogProps) {
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [visitedAt, setVisitedAt] = useState(todayAsDateString());
  const [notes, setNotes] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      setCityId("");
      return;
    }
    setLoadingCities(true);
    setCityId("");
    fetch(`/api/places/cities?countryId=${countryId}`)
      .then((r) => r.json())
      .then((data: CityOption[]) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [countryId]);

  function reset() {
    setCountryId("");
    setCityId("");
    setVisitedAt(todayAsDateString());
    setNotes("");
    setCities([]);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!countryId && !cityId) {
      setError("Please select at least a country.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        countryId: countryId || undefined,
        cityId: cityId || undefined,
        visitedAt,
        notes: notes.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    const visit = data as VisitWithRelations;
    onAdd({
      ...visit,
      visitedAt:
        typeof visit.visitedAt === "string"
          ? visit.visitedAt
          : new Date(visit.visitedAt).toISOString(),
      createdAt:
        typeof visit.createdAt === "string"
          ? visit.createdAt
          : new Date(visit.createdAt).toISOString(),
      updatedAt:
        typeof visit.updatedAt === "string"
          ? visit.updatedAt
          : new Date(visit.updatedAt).toISOString(),
    });
    reset();
    onClose();
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Add Visit
          </h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Country
            </label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              City{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!countryId || loadingCities}
              className={inputClass}
            >
              <option value="">
                {!countryId
                  ? "Select a country first"
                  : loadingCities
                    ? "Loading…"
                    : cities.length === 0
                      ? "No cities available"
                      : "Select a city…"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date visited
            </label>
            <input
              type="date"
              required
              value={visitedAt}
              max={todayAsDateString()}
              onChange={(e) => setVisitedAt(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notes{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Any memories or highlights…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "Saving…" : "Save visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
