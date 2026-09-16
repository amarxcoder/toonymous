"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Nav } from "./Nav";

// Layout: bottom tab bar mobile / left rail desktop >=1024px
// (05-ui-styleguide.md). Only shown once a session exists - logged-out
// screens (/, /login, /signup) already render their own centered layout.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !me) {
    return (
      <>
        {/* The silent refresh-cookie check this gates on is a network round
            trip to a free-tier host that can be asleep (cold start), so
            "loading" can run long enough to look like the nav/icons never
            showed up rather than a brief flash. This bar is the only signal
            of that while it lasts; it never blocks children, so a
            logged-out visit to a marketing page (/, /login, /signup) still
            renders instantly, unaffected. */}
        {loading && (
          <div
            role="progressbar"
            aria-label={strings.common.loading}
            className="fixed inset-x-0 top-0 z-50 h-[2.5px] overflow-hidden bg-transparent"
          >
            <span className="brand-gradient block h-full w-full animate-indeterminate" />
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col lg:pl-60">
      <Nav />
      {/* Keyed on the route so each screen fades in on navigation rather than
          swapping instantly. Next already remounts the page component on a
          path change, so this key adds a transition, not a re-render. */}
      <div
        key={pathname}
        className="flex flex-1 animate-fade-in flex-col pb-[max(4.5rem,calc(3.5rem+env(safe-area-inset-bottom)))] lg:pb-0"
      >
        {children}
      </div>
    </div>
  );
}
