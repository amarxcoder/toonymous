"use client";

import { useEffect, useState } from "react";
import { ApiError, ComplianceFlag, getComplianceFlags, reviewComplianceFlag } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { Button } from "@/components/Button";

// Restricted compliance workflow (F5.1, N6) - deliberately separate from
// /admin/moderation. Only ever shows the fact a CSAM/NSFW match occurred,
// never the image itself (nothing is ever stored for a blocked upload, F1.3).
export default function CompliancePage() {
  const { accessToken, me, loading } = useAuth();
  const { showToast } = useToast();
  const [flags, setFlags] = useState<ComplianceFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const authorized = me?.role === "complianceOfficer";

  useEffect(() => {
    if (!authorized || !accessToken) return;
    getComplianceFlags(accessToken)
      .then((r) => setFlags(r.flags))
      .catch((err) => setError(err instanceof ApiError ? err.message : "could not load"));
  }, [authorized, accessToken]);

  async function onReview(id: string) {
    if (!accessToken) return;
    try {
      await reviewComplianceFlag(accessToken, id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "could not mark reviewed", "error");
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
      <h1 className="text-xl font-semibold">Compliance flags</h1>
      <p className="text-xs text-text-secondary">
        Automated safety pre-check matches, unreviewed. No image content is stored or shown here -
        the original was never written to disk (F1.3).
      </p>
      {error && <p className="text-sm text-accent-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        {flags.map((f) => (
          <div key={f.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-sm">{f.reason}</p>
            <p className="text-xs text-text-secondary">{new Date(f.createdAt).toLocaleString()}</p>
            <Button variant="secondary" onClick={() => onReview(f.id)}>
              Mark reviewed
            </Button>
          </div>
        ))}
        {flags.length === 0 && (
          <p className="py-12 text-center text-sm text-text-secondary">No unreviewed flags.</p>
        )}
      </div>
    </main>
  );
}
