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
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { BellIcon, ShieldIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { Sheet } from "@/components/Sheet";
import { RowSkeleton } from "@/components/Skeleton";
import { TextArea } from "@/components/TextField";

const APPEAL_STATUS_STYLES: Record<string, string> = {
  pending: "bg-accent-warning/12 text-accent-warning",
  approved: "bg-accent-success/12 text-accent-success",
  denied: "bg-accent-danger/10 text-accent-danger",
};

export default function AppealsPage() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [actions, setActions] = useState<ActionableModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getActionableModerationActions(accessToken)
      .then((r) => setActions(r.actions))
      .catch((err) => setError(err instanceof ApiError ? err.message : strings.appeals.loadError))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function onSubmitAppeal(e: FormEvent, actionId: string) {
    e.preventDefault();
    if (!accessToken || !reason.trim()) return;
    setBusy(true);
    try {
      await submitAppeal(accessToken, actionId, reason.trim());
      setActions((prev) =>
        prev.map((a) =>
          a.id === actionId ? { ...a, appeal: { id: "pending", status: "pending" } } : a
        )
      );
      setAppealingId(null);
      setReason("");
      showToast(strings.appeals.appealSent, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.appeals.appealError, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <PageHeader title={strings.appeals.title} />
        <EmptyState icon={<BellIcon className="h-6 w-6" />} title={strings.appeals.loginPrompt} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <PageHeader title={strings.appeals.title} subtitle={strings.appeals.subtitle} />

      {error && (
        <p role="alert" className="text-[13px] text-accent-danger">
          {error}
        </p>
      )}

      {loading ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label={strings.appeals.loadingLabel}
        >
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : actions.length > 0 ? (
        <ul className="stagger flex flex-col gap-3">
          {actions.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-warning/12 text-accent-warning">
                  <ShieldIcon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {strings.appeals.actions[a.action] ?? a.action}
                  </p>
                  <p className="text-[11.5px] text-text-faint">{timeAgo(a.createdAt)}</p>
                  {a.note && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-secondary">
                      {a.note}
                    </p>
                  )}
                </div>
              </div>

              {a.appeal ? (
                <span
                  className={`w-fit rounded-pill px-2.5 py-1 text-[11.5px] font-semibold capitalize ${
                    APPEAL_STATUS_STYLES[a.appeal.status] ?? "bg-bg-subtle text-text-secondary"
                  }`}
                >
                  {strings.appeals.appealPending(a.appeal.status)}
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-fit"
                  onClick={() => {
                    setReason("");
                    setAppealingId(a.id);
                  }}
                >
                  {strings.appeals.appeal}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ShieldIcon className="h-6 w-6" />}
          title={strings.appeals.empty}
          body={strings.appeals.emptyBody}
        />
      )}

      <Sheet
        open={appealingId !== null}
        onClose={() => {
          setAppealingId(null);
          setReason("");
        }}
        title={strings.appeals.appealTitle}
      >
        {appealingId && (
          <form onSubmit={(e) => onSubmitAppeal(e, appealingId)} className="pb-2">
            <TextArea
              id={`appeal-${appealingId}`}
              label={strings.appeals.appealPrompt}
              placeholder={strings.appeals.appealPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              showCounter
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
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
              <Button type="submit" disabled={!reason.trim()} loading={busy}>
                {strings.appeals.appealSubmit}
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </main>
  );
}
