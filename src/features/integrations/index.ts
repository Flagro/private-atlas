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
 * Built-in adapter stubs (activate by implementing the methods):
 *   src/features/integrations/calendar/   — Google Calendar sync
 *   src/features/integrations/images/     — Photo attachments
 *   src/features/integrations/social/     — Social sharing
 */

export type {
  IntegrationAdapter,
  VisitEvent,
  VisitEventPayload,
  VisitEventType,
} from "./types";

export { registerAdapter, emitVisitEvent, buildVisitEvent } from "./event-emitter";
