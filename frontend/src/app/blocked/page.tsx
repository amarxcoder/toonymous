"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, blockHandle, getBlockedHandles, unblockHandle } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";

export default function BlockedPage() {
  const { accessToken } = useAuth();
  const [handles, setHandles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getBlockedHandles(accessToken)
      .then((r) => setHandles(r.handles))
      .catch((err) => setError(err instanceof ApiError ? err.message : strings.blocked.loadError));
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.blocked.blockError);
    } finally {
      setBusy(false);
    }
  }

  async function onUnblock(handle: string) {
    if (!accessToken) return;
    try {
      await unblockHandle(accessToken, handle);
      setHandles((prev) => prev.filter((h) => h !== handle));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : strings.blocked.unblockError);
    }
  }

  if (!accessToken) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-text-secondary">{strings.blocked.loginPrompt}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{strings.blocked.title}</h1>
      <form onSubmit={onBlock} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={strings.blocked.inputPlaceholder}
          className="flex-1 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent-primary"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          {strings.blocked.block}
        </Button>
      </form>

      {error && <p className="text-sm text-accent-danger">{error}</p>}

      <div className="flex flex-col gap-2">
        {handles.map((h) => (
          <div
            key={h}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <span className="text-sm">{h}</span>
            <Button variant="ghost" onClick={() => onUnblock(h)}>
              {strings.blocked.unblock}
            </Button>
          </div>
        ))}
        {handles.length === 0 && (
          <p className="py-6 text-center text-sm text-text-secondary">{strings.blocked.empty}</p>
        )}
      </div>
    </main>
  );
}
