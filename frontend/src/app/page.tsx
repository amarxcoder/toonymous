"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  GlobeIcon,
  HomeIcon,
  LockIcon,
  LogOutIcon,
  PlusSquareIcon,
  RefreshIcon,
  ScaleIcon,
  ShieldIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/Icons";
import { ListGroup, ListRow } from "@/components/ListRow";
import { LogoMark } from "@/components/Logo";
import { Skeleton } from "@/components/Skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";

const STEP_ICONS = [LockIcon, SparkleIcon, ScaleIcon];

function ProfileSkeleton() {
  return (
    <main
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8"
      aria-busy="true"
      aria-label={strings.common.loading}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-surface p-7 shadow-card">
        <Skeleton className="h-[76px] w-[76px] rounded-full" />
        <Skeleton className="h-4 w-36 rounded-pill" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </main>
  );
}

// Logged-out landing. The three steps are the product's actual guarantees,
// not marketing claims, so they double as the explanation of what signing up
// commits you to.
function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10 px-5 py-14">
      <div className="flex animate-rise flex-col items-center gap-5 text-center">
        <LogoMark size={56} />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] leading-[1.15] font-bold tracking-[-0.02em]">
            {strings.home.landing.headline}
            <br />
            <span className="text-accent-primary-text">{strings.home.landing.headlineAccent}</span>
          </h1>
          <p className="text-[14.5px] leading-relaxed text-text-secondary">
            {strings.home.tagline}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Link href="/signup" className="sm:w-auto">
            <Button size="lg" className="w-full">
              {strings.home.createAccount}
            </Button>
          </Link>
          <Link href="/login" className="sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full">
              {strings.common.logIn}
            </Button>
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-[11px] font-bold tracking-wide text-text-faint uppercase">
          {strings.home.landing.pillarsTitle}
        </h2>
        <ol className="stagger flex flex-col gap-3">
          {strings.home.landing.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? GlobeIcon;
            return (
              <li
                key={step.title}
                className="flex gap-3.5 rounded-xl border border-border bg-bg-surface p-4 shadow-xs"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary-text">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <div>
                  <strong className="block text-[13.5px] font-semibold">{step.title}</strong>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-text-secondary">
                    {step.body}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-col items-center gap-2.5">
        <span className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
          {strings.nav.appearance}
        </span>
        <ThemeToggle />
      </div>
    </main>
  );
}

export default function HomePage() {
  const { me, loading, logout, rerollHandle, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <ProfileSkeleton />;
  if (!me) return <Landing />;

  async function withBusy(fn: () => Promise<void>, successMessage?: string) {
    setBusy(true);
    try {
      await fn();
      if (successMessage) showToast(successMessage, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : strings.common.somethingWrong,
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  const noRerollsLeft = me.handleRerollsRemaining <= 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      {/* Identity card. The handle is the only identifier this app has, so it
          gets the display treatment a name would get elsewhere. */}
      <section className="flex animate-rise flex-col items-center gap-3 rounded-2xl border border-border bg-bg-surface p-7 text-center shadow-card">
        <Avatar seed={me.avatarSeed} size={76} ring />
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[17px] font-semibold">{me.handle}</p>
          <p className="text-[12px] text-text-faint">{strings.nav.anonymousSession}</p>
        </div>

        <dl className="mt-1 grid w-full grid-cols-2 gap-2">
          <div className="rounded-md bg-bg-base px-3 py-2.5">
            <dt className="text-[11px] font-medium tracking-wide text-text-faint uppercase">
              {strings.home.followersLabel}
            </dt>
            <dd className="mt-0.5 text-[17px] font-bold tabular-nums">{me.followerCount}</dd>
          </div>
          <div className="rounded-md bg-bg-base px-3 py-2.5">
            <dt className="text-[11px] font-medium tracking-wide text-text-faint uppercase">
              {strings.home.rerollsLabel}
            </dt>
            <dd className="mt-0.5 text-[17px] font-bold tabular-nums">
              {me.handleRerollsRemaining}
            </dd>
          </div>
        </dl>

        <div className="mt-1 grid w-full grid-cols-2 gap-2">
          <Link href="/feed">
            <Button variant="secondary" className="w-full" icon={<HomeIcon className="h-4 w-4" />}>
              {strings.home.viewFeed}
            </Button>
          </Link>
          <Link href="/compose">
            <Button className="w-full" icon={<PlusSquareIcon className="h-4 w-4" />}>
              {strings.home.newPost}
            </Button>
          </Link>
        </div>
      </section>

      <ListGroup title={strings.home.accountSection}>
        <ListRow
          icon={<LockIcon className="h-[17px] w-[17px]" />}
          label={strings.home.blockedHandles}
          hint={strings.home.blockedHandlesHint}
          href="/blocked"
        />
        <ListRow
          icon={<ShieldIcon className="h-[17px] w-[17px]" />}
          label={strings.home.moderationActions}
          hint={strings.home.moderationActionsHint}
          href="/appeals"
        />
        <ListRow
          icon={<RefreshIcon className="h-[17px] w-[17px]" />}
          label={strings.home.rerollHandle}
          hint={noRerollsLeft ? strings.home.rerollNoneLeft : strings.home.rerollHandleHint}
          disabled={busy || noRerollsLeft}
          onClick={() => withBusy(rerollHandle, strings.home.rerollSuccess)}
          trailing={<span />}
        />
      </ListGroup>

      {/* Roles are granted out of band (npm run set-role) - there is no
          self-service path, so these rows simply do not exist for a normal
          account rather than being shown disabled. */}
      {(me.role === "moderator" || me.role === "complianceOfficer") && (
        <ListGroup title={strings.home.staffSection}>
          {me.role === "moderator" && (
            <ListRow
              icon={<ScaleIcon className="h-[17px] w-[17px]" />}
              label={strings.home.moderationQueue}
              hint={strings.home.moderationQueueHint}
              href="/admin/moderation"
            />
          )}
          {me.role === "complianceOfficer" && (
            <ListRow
              icon={<ShieldIcon className="h-[17px] w-[17px]" />}
              label={strings.home.complianceFlags}
              hint={strings.home.complianceFlagsHint}
              href="/admin/compliance"
            />
          )}
        </ListGroup>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[11px] font-bold tracking-wide text-text-faint uppercase">
          {strings.home.appearanceSection}
        </h2>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg-surface px-4 py-3.5 shadow-xs">
          <p className="text-[12.5px] leading-snug text-text-secondary">
            {strings.home.appearanceHint}
          </p>
          <ThemeToggle />
        </div>
      </section>

      <ListGroup title={strings.home.dangerSection}>
        <ListRow
          icon={<LogOutIcon className="h-[17px] w-[17px]" />}
          label={strings.home.logOut}
          disabled={busy}
          onClick={() => withBusy(logout, strings.home.loggedOut)}
          trailing={<span />}
        />
        <ListRow
          icon={<TrashIcon className="h-[17px] w-[17px]" />}
          label={strings.home.deleteAccount}
          hint={strings.home.deleteConfirmBody}
          destructive
          disabled={busy}
          onClick={() => setConfirmingDelete(true)}
          trailing={<span />}
        />
      </ListGroup>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => withBusy(deleteAccount)}
        title={strings.home.deleteConfirmTitle}
        description={strings.home.deleteConfirmBody}
        confirmLabel={strings.home.deleteConfirmYes}
        destructive
      />
    </main>
  );
}
