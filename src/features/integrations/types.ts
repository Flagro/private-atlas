// Core event types emitted by the visits feature.
// Integration adapters subscribe to these and react accordingly.

export type VisitEventType = "VisitCreated" | "VisitUpdated" | "VisitDeleted";

export interface VisitEventPayload {
  visitId: string;
  userId: string;
  countryCode?: string;
  countryName?: string;
  cityName?: string;
  visitedAt: string; // ISO 8601
  notes?: string | null;
}

export interface VisitEvent {
  type: VisitEventType;
  payload: VisitEventPayload;
  occurredAt: string; // ISO 8601
}

/**
 * Implement this interface to create an integration adapter.
 *
 * Each method is optional — only implement what your integration needs.
 *
 * @example
 * ```ts
 * // src/features/integrations/calendar/index.ts
 * export const calendarAdapter: IntegrationAdapter = {
 *   name: "google-calendar",
 *   async onVisitCreated(event) {
 *     await createCalendarEvent(event.payload);
 *   },
 * };
 * ```
 */
export interface IntegrationAdapter {
  /** Unique identifier for this adapter (used in logs). */
  name: string;
  onVisitCreated?(event: VisitEvent): Promise<void>;
  onVisitUpdated?(event: VisitEvent): Promise<void>;
  onVisitDeleted?(event: VisitEvent): Promise<void>;
}
