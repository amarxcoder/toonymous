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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-bg-surface p-1">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-label={`${SWATCH[t].label} theme`}
          aria-pressed={theme === t}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-bg-surface transition-shadow"
          style={{
            background: SWATCH[t].gradient,
            boxShadow: theme === t ? "0 0 0 2px var(--text-primary)" : "none",
          }}
        >
          {theme === t && <CheckIcon className="h-3 w-3 text-white" />}
        </button>
      ))}
    </div>
  );
}
