"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "./Icons";

// Grouped settings row. Replaces the stack of identical secondary buttons
// the profile screen used to be: an icon, a label and a one-line
// explanation give each destination a distinct shape to aim at, and the
// group border ties related rows together.
export function ListRow({
  icon,
  label,
  hint,
  href,
  onClick,
  disabled = false,
  trailing,
  destructive = false,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
  destructive?: boolean;
}) {
  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
          destructive
            ? "bg-accent-danger/10 text-accent-danger"
            : "bg-accent-primary/10 text-accent-primary-text"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={`block text-[14px] font-semibold ${
            destructive ? "text-accent-danger" : "text-text-primary"
          }`}
        >
          {label}
        </span>
        {hint && (
          <span className="block text-[12px] leading-snug text-text-faint">{hint}</span>
        )}
      </span>
      {trailing ?? <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-faint" />}
    </>
  );

  const className = `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-out ${
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-bg-subtle"
  }`;

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {body}
    </button>
  );
}

// Wraps a set of rows into one bordered card with hairline separators.
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && (
        <h2 className="px-1 text-[11px] font-bold tracking-wide text-text-faint uppercase">
          {title}
        </h2>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-surface shadow-xs">
        {children}
      </div>
    </section>
  );
}
