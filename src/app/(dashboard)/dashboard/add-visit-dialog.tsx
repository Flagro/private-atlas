"use client";

import { useEffect, useState } from "react";
import type { CityOption, CountryOption, VisitWithRelations } from "@/types";
import { todayAsDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
    if (!countryId) return;

    const controller = new AbortController();
    // Loading state tracks in-flight fetch for this country; effect syncs URL → list.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setLoadingCities(true);

    fetch(`/api/places/cities?countryId=${countryId}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          setCities([]);
          return;
        }
        const data: unknown = await r.json();
        setCities(Array.isArray(data) ? (data as CityOption[]) : []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setCities([]);
      })
      .finally(() => setLoadingCities(false));

    return () => controller.abort();
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

    let res: Response;
    try {
      res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: countryId || undefined,
          cityId: cityId || undefined,
          visitedAt,
          notes: notes.trim() || undefined,
        }),
      });
    } catch {
      setSubmitting(false);
      setError("Network error. Check your connection and try again.");
      return;
    }

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
            aria-label="Close"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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
            <Label htmlFor="visit-country">Country</Label>
            <Select
              id="visit-country"
              value={countryId}
              onChange={(e) => {
                const v = e.target.value;
                setCountryId(v);
                setCityId("");
                if (!v) setCities([]);
              }}
            >
              <option value="">Select a country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visit-city">
              City{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Select
              id="visit-city"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!countryId || loadingCities}
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
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visit-date">Date visited</Label>
            <Input
              id="visit-date"
              type="date"
              required
              value={visitedAt}
              max={todayAsDateString()}
              onChange={(e) => setVisitedAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="visit-notes">
              Notes{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Any memories or highlights…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save visit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
