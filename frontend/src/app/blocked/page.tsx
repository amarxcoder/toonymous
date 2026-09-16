"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, blockHandle, getBlockedHandles, unblockHandle } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LockIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { RowSkeleton } from "@/components/Skeleton";
import { InlineInput } from "@/components/TextField";

export default function BlockedPage() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [handles, setHandles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Tracks which row is mid-unblock so only that row shows a spinner.
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getBlockedHandles(accessToken)
      .then((r) => setHandles(r.handles))
      .catch((err) => setError(err instanceof ApiError ? err.message : strings.blocked.loadError))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function onBlock(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !input.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await blockHandle(accessToken, input.trim());
      setHandles((prev) => [input.trim(), ...prev]);
      setInput("");
      showToast(strings.blocked.blockedToast, "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : strings.blocked.blockError;
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onUnblock(handle: string) {
    if (!accessToken) return;
    setUnblocking(handle);
    try {
      await unblockHandle(accessToken, handle);
      setHandles((prev) => prev.filter((h) => h !== handle));
      showToast(strings.blocked.unblockedToast, "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : strings.blocked.unblockError;
      setError(message);
      showToast(message, "error");
    } finally {
      setUnblocking(null);
    }
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <PageHeader title={strings.blocked.title} back />
        <EmptyState
          icon={<LockIcon className="h-6 w-6" />}
          title={strings.blocked.loginPrompt}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <PageHeader title={strings.blocked.title} subtitle={strings.blocked.subtitle} back />

      <form onSubmit={onBlock} className="flex gap-2">
        <InlineInput
          label={strings.blocked.inputLabel}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={strings.blocked.inputPlaceholder}
          className="font-mono"
        />
        <Button type="submit" disabled={!input.trim()} loading={busy}>
          {strings.blocked.block}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-[13px] text-accent-danger">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={strings.common.loading}>
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : handles.length > 0 ? (
        <ul className="stagger flex flex-col gap-2">
          {handles.map((h) => (
            <li
              key={h}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-surface p-3 pl-4 shadow-xs"
            >
              <span className="truncate font-mono text-[13.5px] font-medium">{h}</span>
              <Button
                variant="secondary"
                size="sm"
                loading={unblocking === h}
                onClick={() => onUnblock(h)}
              >
                {strings.blocked.unblock}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<LockIcon className="h-6 w-6" />}
          title={strings.blocked.empty}
          body={strings.blocked.emptyBody}
        />
      )}
    </main>
  );
}
