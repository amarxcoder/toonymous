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

export function LogoWordmark({ size = 19 }: { size?: number }) {
  return (
    <span
      className="font-display font-bold tracking-[-0.02em]"
      style={{ fontSize: size, lineHeight: 1.1 }}
    >
      toon<span className="text-accent-primary-text">ymous</span>
    </span>
  );
}
