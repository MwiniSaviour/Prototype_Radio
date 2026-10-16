import Image from "next/image";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NowPlayingChipProps {
  /** Small caps label above the title, e.g. "Now playing" or "Next up". */
  label: string;
  title: string;
  /** Secondary line, rendered with the leading em dash of the reference. */
  artist: string;
  image: ImageAsset;
  className?: string;
}

/**
 * The "Now Playing" chip that sits over the hero photograph: square thumbnail
 * plus label, title and artist line. Tinted glass rather than a solid panel so
 * it reads as an overlay on any show's cover art.
 */
export function NowPlayingChip({
  label,
  title,
  artist,
  image,
  className,
}: NowPlayingChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/15 bg-black/55 p-2 pr-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        <Image src={image.src} alt={image.alt} fill sizes="44px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.625rem] font-bold tracking-[0.16em] text-white/65 uppercase">
          {label}
        </p>
        <p className="truncate text-sm leading-tight font-semibold text-white">{title}</p>
        <p className="truncate text-xs leading-tight text-white/75">— {artist}</p>
      </div>
    </div>
  );
}
