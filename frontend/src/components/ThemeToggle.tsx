"use client";

import { Theme, THEMES, useTheme } from "@/lib/ThemeContext";
import { CheckIcon } from "./Icons";

// Swatch gradients mirror each [data-theme] block in globals.css. Hardcoded
// (not read from CSS vars) so every option is visible regardless of which
// theme is currently active.
const SWATCH: Record<Theme, { gradient: string; label: string }> = {
  violet: { gradient: "linear-gradient(135deg, #7c5cfc, #d92a89 60%, #b06600)", label: "Violet" },
  sunset: { gradient: "linear-gradient(135deg, #fb5607, #ff006e 60%, #ffbe0b)", label: "Sunset" },
  ocean: { gradient: "linear-gradient(135deg, #3a86ff, #00b4d8 60%, #8338ec)", label: "Ocean" },
  mint: { gradient: "linear-gradient(135deg, #06d6a0, #ffd60a 60%, #118ab2)", label: "Mint" },
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`flex w-fit items-center gap-1 rounded-pill border border-border bg-bg-surface p-1 shadow-xs ${className}`}
    >
      {THEMES.map((t) => {
        const selected = theme === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            aria-label={`${SWATCH[t].label} theme`}
            aria-pressed={selected}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-transform duration-[var(--dur-fast)] ease-out hover:scale-110 active:scale-95"
            style={{
              background: SWATCH[t].gradient,
              // Ring drawn with box-shadow rather than a border so the swatch
              // gradient keeps its full 24px circle at both states.
              boxShadow: selected
                ? "0 0 0 2px var(--bg-surface), 0 0 0 4px var(--text-primary)"
                : "none",
            }}
          >
            {selected && <CheckIcon className="h-3 w-3 text-white drop-shadow-sm" />}
          </button>
        );
      })}
    </div>
  );
}
