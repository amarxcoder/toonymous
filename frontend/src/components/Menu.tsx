"use client";

import { ReactNode, useEffect, useRef } from "react";

// Small anchored popover (the post card's "more" menu). Closes on outside
// pointer-down, on Escape, and after any item is chosen. Deliberately not
// the Sheet primitive: a two-item overflow menu as a full modal would be
// heavier than the action it guards.
export function Menu({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      // The trigger lives outside this ref, so it handles its own toggle;
      // closing here too would immediately reopen it on the same click.
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className="absolute top-10 right-0 z-20 flex w-44 origin-top-right animate-pop-in flex-col overflow-hidden rounded-lg border border-border bg-bg-elevated p-1 shadow-pop"
    >
      {children}
    </div>
  );
}

export function MenuItem({
  onClick,
  icon,
  destructive = false,
  children,
}: {
  onClick: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] font-medium transition-colors duration-[var(--dur-fast)] ease-out ${
        destructive
          ? "text-accent-danger hover:bg-accent-danger/8"
          : "text-text-primary hover:bg-bg-subtle"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
