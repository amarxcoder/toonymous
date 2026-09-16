import { ReactNode } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";
import { GlobeIcon, LockIcon, SparkleIcon } from "./Icons";
import { LogoMark, LogoWordmark } from "./Logo";

const PILLAR_ICONS = [SparkleIcon, GlobeIcon, LockIcon];

// Shared chrome for /login and /signup. Single centered card on mobile; from
// 1024px up, the same card sits beside a brand panel that restates the three
// pillars, so the wide-screen layout is doing something rather than leaving
// the form floating in the middle of an empty page.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 lg:py-16">
      <div className="grid w-full max-w-4xl items-center gap-12 lg:grid-cols-[1fr_400px]">
        <section className="hidden animate-rise flex-col gap-7 lg:flex">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <LogoMark size={40} />
            <LogoWordmark size={24} />
          </Link>
          <h2 className="font-display text-[32px] leading-[1.15] font-bold tracking-[-0.02em]">
            {strings.home.landing.headline}
            <br />
            <span className="text-accent-primary-text">{strings.home.landing.headlineAccent}</span>
          </h2>
          <ul className="flex flex-col gap-4">
            {strings.rightRail.pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[i] ?? SparkleIcon;
              return (
                <li key={p.title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary-text">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <strong className="block text-[13.5px] font-semibold">{p.title}</strong>
                    <span className="text-[12.5px] leading-snug text-text-secondary">{p.body}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <main className="flex w-full animate-pop-in flex-col gap-6 rounded-2xl border border-border bg-bg-surface p-7 shadow-card sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <span className="lg:hidden">
              <LogoMark size={44} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-[26px] leading-tight font-bold tracking-[-0.01em]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[13.5px] leading-relaxed text-text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
          {children}
          <p className="text-center text-[13px] text-text-secondary lg:text-left">{footer}</p>
        </main>
      </div>
    </div>
  );
}
