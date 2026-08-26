"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ActionableModerationAction,
  ApiError,
  getActionableModerationActions,
  submitAppeal,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";

export default function AppealsPage() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [actions, setActions] = useState<ActionableModerationAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    getActionableModerationActions(accessToken)
      .then((r) => setActions(r.actions))
      .catch((err) => setError(err instanceof ApiError ? err.message : strings.appeals.loadError));
  }, [accessToken]);

  async function onSubmitAppeal(e: FormEvent, actionId: string) {
    e.preventDefault();
    if (!accessToken || !reason.trim()) return;
    try {
      await submitAppeal(accessToken, actionId, reason.trim());
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, appeal: { id: "pending", status: "pending" } } : a))
      );
      setAppealingId(null);
      setReason("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.appeals.appealError, "error");
    }
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-text-secondary">{strings.appeals.loginPrompt}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{strings.appeals.title}</h1>
      {error && <p className="text-sm text-accent-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        {actions.map((a) => (
          <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">{strings.appeals.actions[a.action] ?? a.action}</p>
            {a.note && <p className="text-xs text-text-secondary">{a.note}</p>}
            {a.appeal ? (
              <p className="text-xs text-text-secondary">
                {strings.appeals.appealPending(a.appeal.status)}
              </p>
            ) : appealingId === a.id ? (
              <form onSubmit={(e) => onSubmitAppeal(e, a.id)} className="flex flex-col gap-2">
                <label htmlFor={`appeal-${a.id}`} className="text-xs font-medium text-text-primary">
                  {strings.appeals.appealPrompt}
                </label>
                <textarea
                  id={`appeal-${a.id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={strings.appeals.appealPlaceholder}
                  rows={2}
                  maxLength={500}
                  autoFocus
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent-primary"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={!reason.trim()}>
                    {strings.appeals.appealSubmit}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAppealingId(null);
                      setReason("");
                    }}
                  >
                    {strings.common.cancel}
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" onClick={() => setAppealingId(a.id)}>
                {strings.appeals.appeal}
              </Button>
            )}
          </div>
        ))}
        {actions.length === 0 && (
          <p className="py-6 text-center text-sm text-text-secondary">{strings.appeals.empty}</p>
        )}
      </div>
    </main>
  );
}
