"use client";

import { useState } from "react";
import Image from "next/image";
import { avatarUrl } from "@/lib/api";

// Generated abstract avatar, circular. `ring` wraps it in the 1.5px brand
// gradient ring reserved for the post header and the "you" chip
// (05-ui-styleguide.md); everywhere else it gets a plain 1px border so it
// still reads against a thumbnail behind it.
//
// Always decorative: the handle next to it is the real identifier, so alt is
// deliberately empty rather than repeating the handle to a screen reader.
export function Avatar({
  seed,
  size = 36,
  ring = false,
  className = "",
}: {
  seed: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  const img = (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full bg-bg-subtle"
      style={{ width: size, height: size }}
    >
      {!loaded && <span className="skeleton absolute inset-0 block rounded-full" />}
      <Image
        src={avatarUrl(seed)}
        alt=""
        width={size}
        height={size}
        unoptimized
        onLoad={() => setLoaded(true)}
        className={`rounded-full transition-opacity duration-[var(--dur)] ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: size, height: size }}
      />
    </span>
  );

  if (!ring) {
    return <span className={`block shrink-0 ring-1 ring-border rounded-full ${className}`}>{img}</span>;
  }

  return (
    <span className={`brand-gradient block shrink-0 rounded-full p-[1.5px] ${className}`}>
      <span className="block rounded-full bg-bg-surface p-[1.5px]">{img}</span>
    </span>
  );
}
