"use client";

import { useState } from "react";
import Image from "next/image";
import { strings } from "@/lib/strings";
import { SparkleIcon } from "./Icons";

// Cartoonized image with a shimmer placeholder held underneath until the
// bitmap decodes, so a slow image leaves a correctly sized card rather than
// a collapsing one. Also covers the pre-"ready" case, where a post exists
// but its cartoon does not yet.
export function PostImage({
  src,
  priority = false,
}: {
  src: string | null;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-bg-subtle text-text-faint">
        <SparkleIcon className="h-7 w-7 animate-pulse" />
        <span className="text-[12.5px] font-medium">{strings.postCard.pendingLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-bg-subtle">
      {!loaded && <div className="skeleton absolute inset-0" />}
      <Image
        src={src}
        alt={strings.postCard.imageAlt}
        width={640}
        height={640}
        unoptimized
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-[var(--dur-slow)] ease-out group-hover:scale-[1.02] ${
          loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.02] opacity-0 blur-sm"
        }`}
      />
    </div>
  );
}
