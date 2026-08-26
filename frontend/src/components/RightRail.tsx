import { strings } from "@/lib/strings";

// Desktop-only filler for the dead space beside the centered feed column on
// wide screens. Deliberately just the three non-negotiable pillars - no
// "global stats" widget, because faking numbers (like the reference mock's
// placeholder "48,912 cartoonized today") would violate the same honesty
// this app is selling; this app has no such live metric to show yet.
export function RightRail() {
  return (
    <aside className="hidden w-72 shrink-0 pt-1 xl:block">
      <div className="rounded-2xl border border-border bg-bg-surface p-5">
        <h3 className="mb-3.5 text-[11px] font-bold tracking-wide text-text-faint uppercase">
          {strings.rightRail.title}
        </h3>
        <div className="flex flex-col gap-3.5">
          {strings.rightRail.pillars.map((p) => (
            <div key={p.title} className="flex gap-2.5">
              <span className="brand-gradient mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              <div>
                <strong className="block text-[12.5px] font-semibold">{p.title}</strong>
                <span className="text-[11.5px] leading-snug text-text-faint">{p.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
