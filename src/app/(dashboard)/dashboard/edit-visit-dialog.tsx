"use client";

import { useEffect, useRef, useState } from "react";
import type { CityOption, CountryOption, VisitWithRelations } from "@/types";
import { todayAsDateString } from "@/lib/utils";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EditVisitDialogProps {
  visit: VisitWithRelations | null;
  countries: CountryOption[];
  onClose: () => void;
  onEdit: (visit: VisitWithRelations) => void;
}

export function EditVisitDialog({
  visit,
  countries,
  onClose,
  onEdit,
}: EditVisitDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [visitedAt, setVisitedAt] = useState(todayAsDateString());
  const [notes, setNotes] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields whenever the dialog opens with a different visit
  useEffect(() => {
    if (!visit) return;
    setCountryId(visit.countryId ?? "");
    setCityId(visit.cityId ?? "");
    setVisitedAt(visit.visitedAt.slice(0, 10));
    setNotes(visit.notes ?? "");
    setError(null);
  }, [visit]);

  // Fetch cities whenever country changes
  useEffect(() => {
    if (!countryId) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch lifecycle
    setLoadingCities(true);

    fetch(`/api/places/cities?countryId=${countryId}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) { setCities([]); return; }
        const data: unknown = await r.json();
        setCities(Array.isArray(data) ? (data as CityOption[]) : []);
      })
      .catch((e) => { if (e.name !== "AbortError") setCities([]); })
      .finally(() => setLoadingCities(false));

    return () => controller.abort();
  }, [countryId]);

  function handleClose() {
    setError(null);
    onClose();
  }

  useModalA11y(!!visit, handleClose, panelRef);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visit) return;
    if (!countryId && !cityId) {
      setError("Please select a country or city.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let res: Response;
    try {
      res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: countryId || null,
          cityId: cityId || null,
          visitedAt,
          notes: notes.trim() || null,
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
      setError((data as { error?: string }).error ?? "Something went wrong");
      return;
    }

    const updated = data as VisitWithRelations;
    onEdit({
      ...updated,
      visitedAt:
        typeof updated.visitedAt === "string"
          ? updated.visitedAt
          : new Date(updated.visitedAt).toISOString(),
      createdAt:
        typeof updated.createdAt === "string"
          ? updated.createdAt
          : new Date(updated.createdAt).toISOString(),
      updatedAt:
        typeof updated.updatedAt === "string"
          ? updated.updatedAt
          : new Date(updated.updatedAt).toISOString(),
    });
    handleClose();
  }

  if (!visit) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/20 ring-1 ring-zinc-900/5 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-visit-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-linear-to-r from-teal-50/80 to-transparent px-6 py-4 dark:border-zinc-700 dark:from-teal-950/40 dark:to-transparent">
          <h2
            id="edit-visit-title"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Edit visit
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
            <Label htmlFor="edit-visit-country">Country</Label>
            <Select
              id="edit-visit-country"
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
            <Label htmlFor="edit-visit-city">
              City <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Select
              id="edit-visit-city"
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
            <Label htmlFor="edit-visit-date">Date visited</Label>
            <Input
              id="edit-visit-date"
              type="date"
              required
              value={visitedAt}
              max={todayAsDateString()}
              onChange={(e) => setVisitedAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-visit-notes">
              Notes <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="edit-visit-notes"
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
            <Button type="submit" variant="accent" loading={submitting}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
