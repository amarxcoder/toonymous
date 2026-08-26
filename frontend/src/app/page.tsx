"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { avatarUrl, ApiError } from "@/lib/api";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Logo";

export default function HomePage() {
  const { me, loading, logout, rerollHandle, deleteAccount } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-secondary">Loading...</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <LogoMark size={52} />
        <h1 className="font-display text-3xl font-bold">{strings.feed.title}</h1>
        <p className="text-sm text-text-secondary">{strings.home.tagline}</p>
        <div className="flex gap-3">
          <Link href="/signup">
            <Button>{strings.home.createAccount}</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">{strings.common.logIn}</Button>
          </Link>
        </div>
      </main>
    );
  }

  async function withBusy(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-surface p-8 shadow-[var(--shadow-card)]">
        <div className="brand-gradient rounded-full p-[3px]">
          <Image
            src={avatarUrl(me.avatarSeed)}
            alt="Your generated avatar"
            width={64}
            height={64}
            unoptimized
            className="rounded-full border-2 border-bg-surface"
          />
        </div>
        <p className="font-mono text-lg font-semibold">{me.handle}</p>
        <p className="text-xs text-text-secondary">{strings.home.follower(me.followerCount)}</p>
        <p className="text-xs text-text-secondary">
          {strings.home.reroll(me.handleRerollsRemaining)}
        </p>

        {error && <p className="text-sm text-accent-danger">{error}</p>}

        <div className="flex w-full flex-col gap-2">
          <Link href="/feed">
            <Button className="w-full">{strings.home.viewFeed}</Button>
          </Link>
          <Link href="/compose">
            <Button variant="secondary" className="w-full">
              {strings.home.newPost}
            </Button>
          </Link>
          <Link href="/blocked">
            <Button variant="secondary" className="w-full">
              {strings.home.blockedHandles}
            </Button>
          </Link>
          <Link href="/appeals">
            <Button variant="secondary" className="w-full">
              {strings.home.moderationActions}
            </Button>
          </Link>
          {me.role === "moderator" && (
            <Link href="/admin/moderation">
              <Button variant="secondary" className="w-full">
                {strings.home.moderationQueue}
              </Button>
            </Link>
          )}
          {me.role === "complianceOfficer" && (
            <Link href="/admin/compliance">
              <Button variant="secondary" className="w-full">
                {strings.home.complianceFlags}
              </Button>
            </Link>
          )}
          <Button
            variant="secondary"
            disabled={busy || me.handleRerollsRemaining <= 0}
            onClick={() => withBusy(rerollHandle)}
          >
            {strings.home.rerollHandle}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => withBusy(logout)}>
            {strings.home.logOut}
          </Button>

          {!confirmingDelete ? (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmingDelete(true)}
            >
              {strings.home.deleteAccount}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-accent-danger p-3">
              <p className="text-sm text-text-primary">{strings.home.deleteConfirmBody}</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => withBusy(deleteAccount)}
                >
                  {strings.home.deleteConfirmYes}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(false)}
                >
                  {strings.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
