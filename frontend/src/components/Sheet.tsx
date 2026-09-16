"use client";

import { ReactNode, RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { strings } from "@/lib/strings";
import { IconButton } from "./IconButton";
import { XIcon } from "./Icons";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// One overlay primitive for the whole app: a bottom sheet on mobile (thumb
// reach) and a centered dialog from 640px up, so there is a single set of
// modal semantics to get right rather than one per screen.
//
// Portalled to <body> because an ancestor mid-animation (the .stagger
// transform on feed cards) would otherwise become the containing block for
// `fixed` and pin the overlay inside a post card.
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /* Where to send focus on close, for the case where whatever opened this
     no longer exists by then (a menu item that closed with its menu). */
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Remembers what had focus before the overlay opened so it can be handed
  // back on close, instead of dumping the user at the top of the document.
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    // Read once now: the caller's button is already mounted, and reading a
    // ref during cleanup is what the exhaustive-deps rule warns about.
    const explicitReturn = returnFocusRef?.current ?? null;

    // Scrollbar-gutter on <body> keeps the page from shifting when this
    // removes the scrollbar.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Skip the close button so a keyboard user lands in the field they
    // opened the sheet to fill (or, for a confirm, on Cancel) rather than on
    // dismiss. React never renders an `autofocus` attribute to the DOM, so
    // the control is marked explicitly instead of sniffing for one.
    const panel = panelRef.current;
    const focusables = Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const target = focusables.find((el) => !el.hasAttribute("data-sheet-dismiss")) ?? focusables[0];
    (target ?? panel)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      // Focus trap: keep Tab cycling inside the panel while it is modal.
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // The opener can be gone by now (a menu item unmounts with its menu),
      // which would leave focus on <body> at the top of the document.
      const opener = openerRef.current;
      const restoreTo = explicitReturn?.isConnected
        ? explicitReturn
        : opener?.isConnected
          ? opener
          : null;
      restoreTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  // `open` only ever becomes true from a client interaction, so this branch
  // is what the server renders; the document check keeps the portal call
  // safe if that ever stops being true.
  if (!open || typeof document === "undefined") return null;

  const titleId = `sheet-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-[rgba(15,17,25,0.38)] backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full animate-sheet-up flex-col rounded-t-2xl bg-bg-elevated shadow-modal outline-none sm:max-w-md sm:animate-pop-in sm:rounded-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Grab handle: a familiar "this panel came up from the bottom, it
            can go back down" affordance. Mobile only, purely visual. */}
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-pill bg-border sm:hidden"
        />
        <header className="flex items-start gap-3 px-5 pt-4 pb-3 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{description}</p>
            )}
          </div>
          <IconButton
            label={strings.common.close}
            size="sm"
            onClick={onClose}
            data-sheet-dismiss
            className="-mt-1 -mr-1.5"
          >
            <XIcon className="h-[18px] w-[18px]" />
          </IconButton>
        </header>
        {children && <div className="flex-1 overflow-y-auto px-5 pb-1">{children}</div>}
        {footer && <div className="flex justify-end gap-2 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
