"use client";

import { useTheme } from "@/lib/ThemeContext";
import { MoonIcon, SunIcon } from "./Icons";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex w-fit items-center gap-0.5 rounded-full border border-border bg-bg-surface p-0.5">
      <div
        className="brand-gradient absolute top-0.5 left-0.5 h-7 w-7 rounded-full transition-transform duration-200 ease-out"
        style={{ transform: theme === "light" ? "translateX(28px)" : "translateX(0)" }}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Dark theme"
        aria-pressed={theme === "dark"}
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${
          theme === "dark" ? "text-white" : "text-text-faint"
        }`}
      >
        <MoonIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Light theme"
        aria-pressed={theme === "light"}
        className={`relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ${
          theme === "light" ? "text-white" : "text-text-faint"
        }`}
      >
        <SunIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
