import { SpinnerIcon } from "./Icons";

const SIZES = { sm: "h-3.5 w-3.5", md: "h-[18px] w-[18px]", lg: "h-6 w-6" } as const;

// Indeterminate busy indicator for work with no meaningful percentage.
// Decorative by default: the surrounding control or region carries the
// accessible status text, so the icon itself stays aria-hidden.
export function Spinner({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return <SpinnerIcon className={`animate-spin-slow ${SIZES[size]} ${className}`} />;
}
