import { strings } from "@/lib/strings";
import { GlobeIcon, ScaleIcon, SparkleIcon } from "./Icons";

// Desktop-only filler for the dead space beside the centered feed column on
// wide screens. Deliberately just the three non-negotiable pillars - no
// "global stats" widget, because faking numbers (like the reference mock's
// placeholder "48,912 cartoonized today") would violate the same honesty
// this app is selling; this app has no such live metric to show yet.
const PILLAR_ICONS = [SparkleIcon, GlobeIcon, ScaleIcon];

export function RightRail() {
  return (
    <aside className="sticky top-8 hidden w-72 shrink-0 xl:block">
      <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-[11px] font-bold tracking-wide text-text-faint uppercase">
          {strings.rightRail.title}
        </h2>
        <ul className="flex flex-col gap-4">
          {strings.rightRail.pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[i] ?? SparkleIcon;
            return (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-primary/10 text-accent-primary-text">
                  <Icon className="h-[15px] w-[15px]" />
                </span>
                <div>
                  <strong className="block text-[12.5px] font-semibold">{p.title}</strong>
                  <span className="text-[11.5px] leading-snug text-text-faint">{p.body}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
