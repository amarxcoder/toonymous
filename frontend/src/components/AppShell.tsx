"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Nav } from "./Nav";

// Layout: bottom tab bar mobile / left rail desktop >=1024px
// (05-ui-styleguide.md). Only shown once a session exists - logged-out
// screens (/, /login, /signup) already render their own centered layout.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !me) {
    return <>{children}</>;
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
