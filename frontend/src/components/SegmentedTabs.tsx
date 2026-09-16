"use client";

import { ReactNode } from "react";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

// Underline tabs with a single sliding indicator rather than one border per
// button: the indicator animating between tabs is what makes the switch read
// as one control instead of two independent buttons.
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  trailing,
}: {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  trailing?: ReactNode;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  return (
    <div className="flex items-end gap-5 border-b border-border">
      <div role="tablist" aria-label={label} className="relative flex gap-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-t-md px-3 pb-3 text-[14.5px] font-semibold transition-colors duration-[var(--dur-fast)] ease-out ${
                active ? "text-text-primary" : "text-text-faint hover:text-text-secondary"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
        <span
          aria-hidden
          className="absolute -bottom-px h-[2px] rounded-pill bg-text-primary transition-transform duration-[var(--dur)] ease-out"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
      </div>
      {trailing && <div className="ml-auto pb-3">{trailing}</div>}
    </div>
  );
}
