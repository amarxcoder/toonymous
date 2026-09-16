"use client";

import { useEffect, useState } from "react";
import { ApiError, ComplianceFlag, getComplianceFlags, reviewComplianceFlag } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { strings } from "@/lib/strings";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { AlertIcon, CheckIcon, LockIcon, ShieldIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { RowSkeleton } from "@/components/Skeleton";

// Restricted compliance workflow (F5.1, N6) - deliberately separate from
// /admin/moderation. Only ever shows the fact a CSAM/NSFW match occurred,
// never the image itself (nothing is ever stored for a blocked upload, F1.3).
export default function CompliancePage() {
  const { accessToken, me, loading } = useAuth();
  const { showToast } = useToast();
  const [flags, setFlags] = useState<ComplianceFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const authorized = me?.role === "complianceOfficer";

  useEffect(() => {
    if (!authorized || !accessToken) return;
    getComplianceFlags(accessToken)
      .then((r) => setFlags(r.flags))
      .catch((err) => setError(err instanceof ApiError ? err.message : strings.compliance.loadError))
      .finally(() => setFlagsLoading(false));
  }, [authorized, accessToken]);

  async function onReview(id: string) {
    if (!accessToken) return;
    setReviewing(id);
    try {
      await reviewComplianceFlag(accessToken, id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
      showToast(strings.compliance.reviewed, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : strings.compliance.reviewError, "error");
    } finally {
      setReviewing(null);
    }
  }

  if (loading) return null;

  if (!authorized) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        <PageHeader title={strings.compliance.title} back />
        <EmptyState icon={<LockIcon className="h-6 w-6" />} title={strings.common.notAuthorized} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8">
      <PageHeader title={strings.compliance.title} back />

      <div className="flex gap-2.5 rounded-md border border-accent-warning/20 bg-accent-warning/8 p-3 text-[12.5px] leading-relaxed text-text-secondary">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-warning" />
        <span>{strings.compliance.subtitle}</span>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-accent-danger">
          {error}
        </p>
      )}

      {flagsLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label={strings.common.loading}>
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : flags.length > 0 ? (
        <ul className="stagger flex flex-col gap-3">
          {flags.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-danger/10 text-accent-danger">
                  <AlertIcon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium break-words">{f.reason}</p>
                  <time dateTime={f.createdAt} className="text-[11.5px] text-text-faint">
                    {new Date(f.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-fit"
                loading={reviewing === f.id}
                onClick={() => onReview(f.id)}
              >
                {strings.compliance.markReviewed}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CheckIcon className="h-6 w-6" />}
          title={strings.compliance.empty}
          body={strings.compliance.emptyBody}
        />
      )}
    </main>
  );
}
