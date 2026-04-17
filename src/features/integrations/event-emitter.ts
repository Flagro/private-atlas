import type { IntegrationAdapter, VisitEvent, VisitEventPayload, VisitEventType } from "./types";

// Module-level registry of adapters. Register adapters at app startup.
const adapters: IntegrationAdapter[] = [];

/**
 * Register an integration adapter.
 * Call once per adapter at application start (e.g. in a server module).
 *
 * @example
 * ```ts
 * registerAdapter(calendarAdapter);
 * registerAdapter(socialAdapter);
 * ```
 */
export function registerAdapter(adapter: IntegrationAdapter): void {
  adapters.push(adapter);
}

/**
 * Emit a visit event to all registered adapters that handle it.
 * Failures in individual adapters are logged but do not block the others.
 * The function itself never throws.
 */
export async function emitVisitEvent(event: VisitEvent): Promise<void> {
  try {
    const handlerKey = `on${event.type}` as `on${VisitEventType}`;

    const activeAdapters = adapters.filter(
      (a) => typeof a[handlerKey] === "function"
    );

    const results = await Promise.allSettled(
      activeAdapters.map((a) => a[handlerKey]!(event))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        console.error(
          `[integrations] Adapter "${activeAdapters[i].name}" failed on ${event.type}:`,
          result.reason
        );
      }
    }
  } catch (err) {
    console.error("[integrations] Unexpected event emitter failure:", err);
  }
}

/** Build a VisitEvent helper (sets occurredAt automatically). */
export function buildVisitEvent(
  type: VisitEventType,
  payload: VisitEventPayload
): VisitEvent {
  return {
    type,
    payload,
    occurredAt: new Date().toISOString(),
  };
}
