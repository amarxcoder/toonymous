"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, useId } from "react";

// Shared field chrome. A soft 3px accent halo on focus rather than a bare
// 1px border swap, so the active field is obvious at a glance without
// shifting layout.
const FIELD_CLASSES =
  "w-full rounded-md border border-border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-faint transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-out outline-none hover:border-border-strong focus:border-accent-primary focus:ring-[3px] focus:ring-accent-primary/18 disabled:opacity-60";

const ERROR_CLASSES = "border-accent-danger focus:border-accent-danger focus:ring-accent-danger/18";

function Shell({
  id,
  label,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-text-primary">
          {label}
        </label>
        {counter && (
          <span aria-hidden className="font-mono text-[11px] text-text-faint">
            {counter}
          </span>
        )}
      </div>
      {children}
      {/* Error takes the hint's slot rather than stacking under it, so the
          form never grows taller when validation fails. */}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-[12px] leading-snug text-accent-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-[12px] leading-snug text-text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Label above the field, never placeholder-as-label (05-ui-styleguide.md).
export function TextField({
  label,
  id,
  hint,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  error?: string | null;
}) {
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={`${FIELD_CLASSES} ${error ? ERROR_CLASSES : ""} ${className}`}
        {...props}
      />
    </Shell>
  );
}

export function TextArea({
  label,
  id,
  hint,
  error,
  showCounter = false,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
  hint?: string;
  error?: string | null;
  /* Only shown when there is a maxLength to count against. */
  showCounter?: boolean;
}) {
  const value = typeof props.value === "string" ? props.value : "";
  const counter =
    showCounter && props.maxLength ? `${value.length}/${props.maxLength}` : undefined;

  return (
    <Shell id={id} label={label} hint={hint} error={error} counter={counter}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={`${FIELD_CLASSES} resize-none leading-relaxed ${error ? ERROR_CLASSES : ""} ${className}`}
        {...props}
      />
    </Shell>
  );
}

// Unlabelled single-line input for inline composers (the comment box), where
// a visible label above would break the row. Still labelled for assistive
// tech via aria-label, never by placeholder alone.
export function InlineInput({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <input id={id} aria-label={label} className={`${FIELD_CLASSES} ${className}`} {...props} />
  );
}
