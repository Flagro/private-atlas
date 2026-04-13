/**
 * Integration adapter system.
 *
 * This module provides a lightweight, event-driven adapter pattern for
 * extending Private Atlas with third-party integrations (calendar sync,
 * image attachments, social sharing, etc.).
 *
 * Usage
 * -----
 * 1. Create an adapter that implements `IntegrationAdapter`.
 * 2. Register it at app start with `registerAdapter(myAdapter)`.
 * 3. Visit events (created / updated / deleted) are emitted automatically by
 *    the visits feature and forwarded to all registered adapters.
 *
 * There are no built-in adapters in-repo yet; add modules (e.g. calendar sync)
 * that implement `IntegrationAdapter`, then call `registerAdapter` once at
 * server startup (for example from `instrumentation.ts`).
 */

export type {
  IntegrationAdapter,
  VisitEvent,
  VisitEventPayload,
  VisitEventType,
} from "./types";

export { registerAdapter, emitVisitEvent, buildVisitEvent } from "./event-emitter";
