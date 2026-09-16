"use client";

import { ButtonHTMLAttributes, ReactNode, Ref } from "react";

// Icon-only control. aria-label is required by the type, not optional, so an
// unlabelled icon button cannot be added by accident (05-ui-styleguide.md).
// 36px minimum hit area on every size, including the visually smaller one.
const SIZES = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
} as const;

// Colour is a named tone rather than a passed-in class, so no caller has to
// fight the default with an important modifier.
const TONES = {
  muted: "text-text-secondary hover:text-text-primary",
  strong: "text-text-primary",
  accent: "text-accent-primary-text",
  like: "text-accent-secondary",
  danger: "text-accent-danger",
} as const;

export function IconButton({
  label,
  size = "md",
  tone = "muted",
  className = "",
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  label: string;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  children: ReactNode;
  /* React 19 passes ref straight through props for function components. */
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-[var(--dur-fast)] ease-out hover:bg-bg-subtle active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${TONES[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
