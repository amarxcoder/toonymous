"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

// Primary is the one gradient-filled, full-pill shape in the app (the
// "brand" surface); everything else stays a restrained 10px rect per
// 05-ui-styleguide.md so chrome doesn't compete with post content.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "brand-gradient rounded-full text-white shadow-[var(--shadow-card)] hover:brightness-105 disabled:opacity-50 disabled:hover:brightness-100",
  secondary:
    "rounded-[10px] border border-border text-text-primary hover:bg-bg-surface disabled:opacity-50",
  ghost: "rounded-[10px] text-text-secondary hover:text-text-primary disabled:opacity-50",
  danger:
    "rounded-[10px] border border-accent-danger text-accent-danger hover:bg-accent-danger hover:text-white disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-150 ease-out disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
