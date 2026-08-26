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
import { Button } from "@/components/Button";

type Tab = "reports" | "appeals";

export default function ModerationQueuePage() {
  const { accessToken, me, loading } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const authorized = me?.role === "moderator";

  async function loadReports() {
    if (!accessToken) return;
    const r = await getReportsQueue(accessToken);
    setReports(r.reports);
  }

  async function loadAppeals() {
    if (!accessToken) return;
    const r = await getAppealsQueue(accessToken);
    setAppeals(r.appeals);
  }

  useEffect(() => {
    if (!authorized) return;
    (tab === "reports" ? loadReports() : loadAppeals()).catch((err) =>
      setError(err instanceof ApiError ? err.message : "could not load queue")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, tab]);

  async function onResolve(
    reportId: string,
    action: "remove_content" | "shadow_limit" | "ban" | "no_action"
  ) {
    if (!accessToken) return;
    try {
      await resolveReport(accessToken, reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "could not resolve report", "error");
    }
  }

  async function onResolveAppeal(appealId: string, status: "approved" | "denied") {
    if (!accessToken) return;
    try {
      await resolveAppeal(accessToken, appealId, status);
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "could not resolve appeal", "error");
    }
  }

  if (loading) return null;

  if (!authorized) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-text-secondary">Not authorized.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Moderation queue</h1>

      <div className="flex gap-2 border-b border-border">
        {(["reports", "appeals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-accent-primary text-text-primary"
                : "text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-accent-danger">{error}</p>}

      {tab === "reports" && (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs text-text-secondary">
                {r.targetType} by {r.target?.authorHandle ?? "unknown"} · reported by {r.reporterHandle}
              </p>
              <p className="text-sm">Reason: {r.reason}</p>
              {r.target && "text" in r.target && <p className="text-sm italic">"{r.target.text}"</p>}
              {r.target && "caption" in r.target && r.target.caption && (
                <p className="text-sm italic">"{r.target.caption}"</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => onResolve(r.id, "no_action")}>
                  No action
                </Button>
                <Button variant="secondary" onClick={() => onResolve(r.id, "remove_content")}>
                  Remove content
                </Button>
                <Button variant="secondary" onClick={() => onResolve(r.id, "shadow_limit")}>
                  Shadow-limit
                </Button>
                <Button variant="danger" onClick={() => onResolve(r.id, "ban")}>
                  Ban
                </Button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <p className="py-12 text-center text-sm text-text-secondary">No open reports.</p>
          )}
        </div>
      )}

      {tab === "appeals" && (
        <div className="flex flex-col gap-3">
          {appeals.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs text-text-secondary">
                {a.userHandle} appealing {a.action.action} on {a.action.targetType}
              </p>
              <p className="text-sm">{a.reason}</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onResolveAppeal(a.id, "approved")}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => onResolveAppeal(a.id, "denied")}>
                  Deny
                </Button>
              </div>
            </div>
          ))}
          {appeals.length === 0 && (
            <p className="py-12 text-center text-sm text-text-secondary">No pending appeals.</p>
          )}
        </div>
      )}
    </main>
  );
}
