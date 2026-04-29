"use client";

import { type RefObject, useEffect, useRef } from "react";

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href]:not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      if (el.closest('[aria-hidden="true"]')) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    }
  );
}

/**
 * Focus trap, Escape to close, body scroll lock, and restore previous focus when closed.
 */
export function useModalA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
): void {
  const lastFocusRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    lastFocusRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;

      const items = getFocusableElements(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const items = getFocusableElements(root);
      if (items.length === 0) {
        root.focus();
        return;
      }
      const formFirst = items.find((el) =>
        el.matches("select, input:not([type='hidden']), textarea")
      );
      (formFirst ?? items[0]).focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      const el = lastFocusRef.current;
      if (el instanceof HTMLElement && document.contains(el)) {
        el.focus();
      }
    };
  }, [open, panelRef]);
}
