"use client";

import { useAuth } from "@/lib/AuthContext";
import { Nav } from "./Nav";

// Layout: bottom tab bar mobile / left rail desktop >=1024px
// (05-ui-styleguide.md). Only shown once a session exists - logged-out
// screens (/, /login, /signup) already render their own centered layout.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();

  if (loading || !me) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col lg:pl-56">
      <Nav />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</div>
    </div>
  );
}
