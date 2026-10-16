import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-7 w-7 text-[0.625rem]",
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
} as const;

export interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}

const INITIALS_PALETTE = [
  "bg-[#1f3a5f] text-white",
  "bg-[#3d2b56] text-white",
  "bg-[#114b3f] text-white",
  "bg-[#5b2a2a] text-white",
  "bg-[#4a3c14] text-white",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Falls back to deterministic initials when no portrait is supplied, so authors
 * render as themselves without needing remote avatar hosting.
 */
export function Avatar({ name, src, size = "sm", className }: AvatarProps) {
  const base = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold uppercase",
    sizes[size],
    className,
  );

  if (src) {
    return (
      <Image
        src={src}
        alt={`Portrait of ${name}`}
        width={64}
        height={64}
        className={cn(base, "object-cover")}
      />
    );
  }

  const paletteIndex =
    Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0) %
    INITIALS_PALETTE.length;

  return (
    <span className={cn(base, INITIALS_PALETTE[paletteIndex])} role="img" aria-label={`Portrait of ${name}`}>
      {initials(name)}
    </span>
  );
}
