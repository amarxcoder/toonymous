import Image from "next/image";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Toonymous"
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function LogoWordmark() {
  return (
    <span className="font-display text-[19px] font-bold">
      toon<span className="text-accent-primary-text">ymous</span>
    </span>
  );
}
