export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="brand-gradient flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size }}
    >
      <span
        className="font-display font-bold text-white"
        style={{ fontSize: size * 0.5 }}
        aria-hidden
      >
        t
      </span>
    </div>
  );
}

export function LogoWordmark() {
  return (
    <span className="font-display text-[19px] font-bold">
      toon<span className="text-accent-primary-text">ymous</span>
    </span>
  );
}
