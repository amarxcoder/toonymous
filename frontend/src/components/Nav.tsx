"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { Avatar } from "./Avatar";
import { BellIcon, HomeIcon, PlusSquareIcon, UserIcon } from "./Icons";
import { LogoMark, LogoWordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// Four destinations, no more (05-ui-styleguide.md): no location tab, no
// "explore/for-you" tab, deliberately, per the no-suggestions pillar.
// "Notifications" surfaces moderation actions taken on the viewer's own
// account/content (/appeals) - there's no separate notifications feature.
//
// `owns` lists the sub-routes that belong to each destination so a detail
// screen still shows its section as active, instead of the nav going blank
// the moment you open a post.
const DESTINATIONS = [
  { href: "/feed", label: strings.nav.feed, Icon: HomeIcon, owns: ["/post"] },
  { href: "/compose", label: strings.nav.post, Icon: PlusSquareIcon, owns: [] },
  { href: "/appeals", label: strings.nav.notifications, Icon: BellIcon, owns: [] },
  { href: "/", label: strings.nav.profile, Icon: UserIcon, owns: ["/blocked", "/admin"] },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string, owns: string[]) =>
    pathname === href || owns.some((prefix) => pathname.startsWith(prefix));
}

export function Nav() {
  const isActive = useIsActive();
  const { me } = useAuth();

  return (
    <>
      {/* Left rail, desktop >=1024px */}
      <aside
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-1 border-r border-border bg-bg-base px-3.5 py-4 lg:flex"
      >
        <Link
          href="/feed"
          className="mb-5 flex items-center gap-2.5 rounded-md px-2 py-1 transition-opacity duration-[var(--dur-fast)] ease-out hover:opacity-80"
        >
          <LogoMark />
          <LogoWordmark />
        </Link>

        <nav className="flex flex-col gap-0.5">
          {DESTINATIONS.map(({ href, label, Icon, owns }) => {
            const active = isActive(href, owns);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3.5 rounded-md px-3 py-2.5 text-[15px] transition-colors duration-[var(--dur-fast)] ease-out ${
                  active
                    ? "bg-bg-surface font-bold text-text-primary shadow-xs"
                    : "font-medium text-text-secondary hover:bg-bg-surface/70 hover:text-text-primary"
                }`}
              >
                {/* Gradient bar on the active item: the same brand surface as
                    the primary CTA, at chrome scale. */}
                {active && (
                  <span
                    aria-hidden
                    className="brand-gradient absolute top-1/2 -left-3.5 h-6 w-[3px] -translate-y-1/2 rounded-r-pill"
                  />
                )}
                <Icon
                  className={`h-[22px] w-[22px] transition-transform duration-[var(--dur-fast)] ease-out group-hover:scale-105 ${
                    active ? "text-accent-primary-text" : ""
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/compose"
          className="brand-gradient mt-4 flex items-center justify-center gap-2 rounded-pill px-3 py-2.5 text-[14.5px] font-bold text-white shadow-card transition-all duration-[var(--dur-fast)] ease-out hover:-translate-y-px hover:shadow-pop hover:brightness-[1.06] active:translate-y-0 active:scale-[0.98]"
        >
          <PlusSquareIcon className="h-[18px] w-[18px]" />
          {strings.nav.newPost}
        </Link>

        <div className="flex-1" />

        <div className="mb-3 flex flex-col gap-2 px-1">
          <span className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            {strings.nav.appearance}
          </span>
          <ThemeToggle />
        </div>

        {me && (
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md border border-border bg-bg-surface p-2 transition-colors duration-[var(--dur-fast)] ease-out hover:bg-bg-subtle"
          >
            <Avatar seed={me.avatarSeed} size={34} ring />
            <div className="min-w-0">
              <strong className="block truncate font-mono text-[12.5px] font-semibold">
                {me.handle}
              </strong>
              <span className="text-[11px] text-text-faint">{strings.nav.anonymousSession}</span>
            </div>
          </Link>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg-base/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/feed" className="flex items-center gap-2">
          <LogoMark size={28} />
          <LogoWordmark size={18} />
        </Link>
        <ThemeToggle />
      </header>

      {/* Bottom tab bar, mobile/tablet */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-base/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {DESTINATIONS.map(({ href, label, Icon, owns }) => {
          const active = isActive(href, owns);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors duration-[var(--dur-fast)] ease-out active:scale-95 ${
                active ? "text-text-primary" : "text-text-faint"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="brand-gradient absolute top-0 h-[2.5px] w-9 rounded-b-pill"
                />
              )}
              <Icon
                className={`h-[22px] w-[22px] transition-transform duration-[var(--dur)] ease-spring ${
                  active ? "scale-110 text-accent-primary-text" : ""
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
