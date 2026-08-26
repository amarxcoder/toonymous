"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { avatarUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { strings } from "@/lib/strings";
import { BellIcon, HomeIcon, PlusSquareIcon, UserIcon } from "./Icons";
import { LogoMark, LogoWordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// Four destinations, no more (05-ui-styleguide.md): no location tab, no
// "explore/for-you" tab, deliberately, per the no-suggestions pillar.
// "Notifications" surfaces moderation actions taken on the viewer's own
// account/content (/appeals) - there's no separate notifications feature.
const DESTINATIONS = [
  { href: "/feed", label: strings.nav.feed, Icon: HomeIcon },
  { href: "/compose", label: strings.nav.post, Icon: PlusSquareIcon },
  { href: "/appeals", label: strings.nav.notifications, Icon: BellIcon },
  { href: "/", label: strings.nav.profile, Icon: UserIcon },
];

export function Nav() {
  const pathname = usePathname();
  const { me } = useAuth();

  return (
    <>
      {/* Left rail, desktop >=1024px */}
      <aside
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col gap-1 border-r border-border bg-bg-base p-3.5 lg:flex"
      >
        <Link href="/feed" className="flex items-center gap-2.5 px-2 pt-1 pb-6">
          <LogoMark />
          <LogoWordmark />
        </Link>

        <nav className="flex flex-col gap-1">
          {DESTINATIONS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3.5 rounded-[10px] px-3 py-2.5 text-[15px] font-medium transition-colors duration-150 ease-out ${
                  active
                    ? "font-bold text-text-primary"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
              >
                <Icon className={`h-[22px] w-[22px] ${active ? "text-accent-primary-text" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/compose"
          className="brand-gradient mx-1 mt-4 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[14.5px] font-bold text-white transition-transform duration-150 ease-out hover:-translate-y-px"
        >
          <PlusSquareIcon className="h-[18px] w-[18px]" />
          {strings.nav.newPost}
        </Link>

        <div className="flex-1" />

        <div className="mb-2.5 ml-1.5">
          <ThemeToggle />
        </div>

        {me && (
          <div className="mx-1 flex items-center gap-2.5 rounded-[10px] border border-border bg-bg-surface p-2">
            <Image
              src={avatarUrl(me.avatarSeed)}
              alt=""
              width={34}
              height={34}
              unoptimized
              className="rounded-[8px]"
            />
            <div className="min-w-0">
              <strong className="block truncate font-mono text-[12.5px] font-semibold">
                {me.handle}
              </strong>
              <span className="text-[11px] text-text-faint">{strings.nav.anonymousSession}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg-base/85 px-4 backdrop-blur-md lg:hidden">
        <Link href="/feed" className="flex items-center gap-2">
          <LogoMark size={28} />
          <LogoWordmark />
        </Link>
        <ThemeToggle />
      </header>

      {/* Bottom tab bar, mobile/tablet */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-base/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {DESTINATIONS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors duration-150 ease-out ${
                active ? "text-text-primary" : "text-text-faint"
              }`}
            >
              <Icon className={`h-[22px] w-[22px] ${active ? "text-accent-primary-text" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
