"use client";

import { RefObject, useState } from "react";
import { strings } from "@/lib/strings";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

// Replaces window.confirm everywhere (05-ui-styleguide.md bans raw
// alert/confirm/prompt). Keeps the dialog open and shows a spinner while the
// action runs, so a slow request can't be double-submitted; the caller
// closes it on success.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  destructive = false,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      description={description}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {strings.common.cancel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={run} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
