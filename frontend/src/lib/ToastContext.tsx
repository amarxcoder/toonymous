"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertIcon, CheckIcon, XIcon } from "@/components/Icons";
import { strings } from "./strings";

type ToastVariant = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

interface ToastState {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastState | null>(null);

const VISIBLE_MS = 4000;
// Long enough for the exit transition below to finish before unmount.
const EXIT_MS = 200;
// Older toasts are dropped rather than stacking into a wall of cards.
const MAX_VISIBLE = 3;

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: string }> = {
  info: { ring: "border-border", icon: "text-accent-primary-text" },
  success: { ring: "border-accent-success/35", icon: "text-accent-success" },
  error: { ring: "border-accent-danger/35", icon: "text-accent-danger" },
};

// Styleguide (05-ui-styleguide.md): "never use a raw alert(); all feedback is
// inline, calm, and actionable." This is the one shared place that renders
// that feedback so every screen can drop window.alert/confirm/prompt.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    timers.current.push(
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS)
    );
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, variant, leaving: false }].slice(-MAX_VISIBLE));
      timers.current.push(setTimeout(() => dismiss(id), VISIBLE_MS));
    },
    [dismiss]
  );

  // Clears pending timers if the provider unmounts mid-toast.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-bg-elevated py-3 pr-2 pl-3.5 shadow-pop transition-all duration-[var(--dur)] ease-out ${
              VARIANT_STYLES[t.variant].ring
            } ${t.leaving ? "translate-y-1 scale-[0.97] opacity-0" : "animate-rise"}`}
          >
            <span className={`mt-px shrink-0 ${VARIANT_STYLES[t.variant].icon}`}>
              {t.variant === "success" ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <AlertIcon className="h-4 w-4" />
              )}
            </span>
            <p className="flex-1 text-[13.5px] leading-snug text-text-primary">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label={strings.common.dismiss}
              className="-mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-faint transition-colors duration-[var(--dur-fast)] ease-out hover:bg-bg-subtle hover:text-text-primary"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
