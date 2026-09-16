"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { strings } from "@/lib/strings";
import { IconButton } from "./IconButton";
import { ArrowLeftIcon } from "./Icons";

// Consistent page title block. The display font is used here and on the
// logo only (05-ui-styleguide.md) - never on functional chrome.
export function PageHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  /* Secondary screens (blocked handles, moderation queues, post detail) get
     an explicit way back; the four nav destinations do not need one. */
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="flex items-start gap-3">
      {back && (
        <IconButton
          label={strings.common.back}
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 mt-0.5"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px]" />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[26px] leading-tight font-bold tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
