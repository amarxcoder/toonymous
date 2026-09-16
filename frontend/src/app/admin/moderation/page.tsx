"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  ModerationAppeal,
  ModerationReport,
  getAppealsQueue,
  getReportsQueue,
  resolveAppeal,
  resolveReport,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { CheckIcon, LockIcon, ScaleIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { RowSkeleton } from "@/components/Skeleton";

type Tab = "reports" | "appeals";

const TABS = [
  { value: "reports" as const, label: strings.moderation.reports },
  { value: "appeals" as const, label: strings.moderation.appeals },
];

export default function ModerationQueuePage() {
  const { me, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("reports");

  const authorized = me?.role === "moderator";

  if (loading) return null;

  if (!authorized) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <PageHeader title={strings.moderation.title} back />
        <EmptyState icon={<LockIcon className="h-6 w-6" />} title={strings.common.notAuthorized} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8">
      <PageHeader title={strings.moderation.title} subtitle={strings.moderation.subtitle} back />

      <SegmentedTabs
        options={TABS}
        value={tab}
        onChange={setTab}
        label={strings.moderation.tabsLabel}
      />

      {/* Each queue owns its own fetch and loading state, so switching tabs
          mounts a fresh one rather than resetting shared state. */}
      {tab === "reports" ? <ReportsQueue /> : <AppealsQueue />}
    </main>
  );
}

function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={strings.common.loading}>
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

function QueueError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-[13px] text-accent-danger">
      {message}
    </p>
  );
}

function ReportsQueue() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Id of the row being resolved, so its button shows progress and the rest
  // of the queue is held until the write lands.
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getReportsQueue(accessToken)
      .then((r) => {
        if (!cancelled) setReports(r.reports);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : strings.moderation.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function onResolve(
    reportId: string,
    action: "remove_content" | "shadow_limit" | "ban" | "no_action"
  ) {
    if (!accessToken) return;
    setResolving(reportId);
    try {
      await resolveReport(accessToken, reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      showToast(strings.moderation.resolved, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.moderation.resolveError, "error");
    } finally {
      setResolving(null);
    }
  }

  if (loading) return <QueueSkeleton />;
  if (error) return <QueueError message={error} />;

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<CheckIcon className="h-6 w-6" />}
        title={strings.moderation.noReports}
        body={strings.moderation.noReportsBody}
      />
    );
  }

  return (
    <ul className="stagger flex flex-col gap-3">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-4 shadow-xs"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[12px] text-text-secondary">
              {strings.moderation.reportedBy(
                r.targetType,
                r.target?.authorHandle ?? strings.moderation.unknownAuthor,
                r.reporterHandle
              )}
            </p>
            <time dateTime={r.createdAt} className="shrink-0 text-[11.5px] text-text-faint">
              {timeAgo(r.createdAt)}
            </time>
          </div>

          <p className="text-[13.5px] text-text-primary">
            <span className="font-semibold">{strings.moderation.reasonLabel}: </span>
            {r.reason}
          </p>

          {/* Quoted target content sits in its own block so a moderator can
              tell it apart from the reporter's words at a glance. */}
          {r.target && "text" in r.target && (
            <blockquote className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-text-secondary italic">
              {r.target.text}
            </blockquote>
          )}
          {r.target && "caption" in r.target && r.target.caption && (
            <blockquote className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-text-secondary italic">
              {r.target.caption}
            </blockquote>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={resolving !== null}
              onClick={() => onResolve(r.id, "no_action")}
            >
              {strings.moderation.actions.no_action}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={resolving !== null}
              onClick={() => onResolve(r.id, "remove_content")}
            >
              {strings.moderation.actions.remove_content}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={resolving !== null}
              onClick={() => onResolve(r.id, "shadow_limit")}
            >
              {strings.moderation.actions.shadow_limit}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={resolving === r.id}
              disabled={resolving !== null}
              onClick={() => onResolve(r.id, "ban")}
            >
              {strings.moderation.actions.ban}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AppealsQueue() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAppealsQueue(accessToken)
      .then((r) => {
        if (!cancelled) setAppeals(r.appeals);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : strings.moderation.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function onResolveAppeal(appealId: string, status: "approved" | "denied") {
    if (!accessToken) return;
    setResolving(appealId);
    try {
      await resolveAppeal(accessToken, appealId, status);
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
      showToast(strings.moderation.appealResolved, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.moderation.appealError, "error");
    } finally {
      setResolving(null);
    }
  }

  if (loading) return <QueueSkeleton />;
  if (error) return <QueueError message={error} />;

  if (appeals.length === 0) {
    return (
      <EmptyState
        icon={<ScaleIcon className="h-6 w-6" />}
        title={strings.moderation.noAppeals}
        body={strings.moderation.noAppealsBody}
      />
    );
  }

  return (
    <ul className="stagger flex flex-col gap-3">
      {appeals.map((a) => (
        <li
          key={a.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-4 shadow-xs"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[12px] text-text-secondary">
              {strings.moderation.appealContext(a.userHandle, a.action.action, a.action.targetType)}
            </p>
            <time dateTime={a.createdAt} className="shrink-0 text-[11.5px] text-text-faint">
              {timeAgo(a.createdAt)}
            </time>
          </div>
          <p className="text-[13.5px] leading-relaxed text-text-primary">{a.reason}</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={resolving !== null}
              onClick={() => onResolveAppeal(a.id, "approved")}
            >
              {strings.moderation.actions.approve}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={resolving === a.id}
              disabled={resolving !== null}
              onClick={() => onResolveAppeal(a.id, "denied")}
            >
              {strings.moderation.actions.deny}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
