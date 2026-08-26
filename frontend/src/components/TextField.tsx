"use client";

import { InputHTMLAttributes } from "react";

// Label above the field, never placeholder-as-label (05-ui-styleguide.md).
export function TextField({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        className="rounded-[10px] border border-border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors duration-150 ease-out focus-visible:border-accent-primary"
        {...props}
      />
    </div>
  );
}
