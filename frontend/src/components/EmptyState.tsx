import { ReactNode } from "react";

// Every list in the app shows this instead of a bare sentence when it has
// nothing in it: an empty feed should look intentional, not broken.
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-rise flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle text-text-faint">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-text-primary">{title}</p>
        {body && <p className="max-w-[34ch] text-[13px] leading-relaxed text-text-secondary">{body}</p>}
      </div>
      {action}
    </div>
  );
}
