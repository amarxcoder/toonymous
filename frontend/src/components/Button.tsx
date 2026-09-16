"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Primary is the one gradient-filled, full-pill shape in the app (the
// "brand" surface); everything else stays a restrained --r-md rect per
// 05-ui-styleguide.md so chrome doesn't compete with post content.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "brand-gradient rounded-pill text-white shadow-card hover:-translate-y-px hover:shadow-pop hover:brightness-[1.06] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-card disabled:hover:brightness-100",
  secondary:
    "rounded-md border border-border bg-bg-surface text-text-primary shadow-xs hover:border-border-strong hover:bg-bg-subtle active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-bg-surface",
  ghost:
    "rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text-primary active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-transparent",
  danger:
    "rounded-md border border-accent-danger bg-bg-surface text-accent-danger hover:bg-accent-danger hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-bg-surface disabled:hover:text-accent-danger",
};

// Heights come from the 4px spacing scale and are fixed per size so a row of
// mixed-variant buttons always lines up. sm is still 36px tall, which keeps
// it above the 32px comfortable-touch floor.
const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /* Swaps the leading icon for a spinner and blocks input, without changing
     the button's width - so a row of buttons doesn't reflow mid-action. */
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-all duration-[var(--dur-fast)] ease-out select-none disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
