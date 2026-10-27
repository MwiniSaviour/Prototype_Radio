import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconWaveform } from "@/components/ui/icons";
import { Wordmark } from "@/components/layout/Wordmark";

export interface PromoCardProps {
  className?: string;
}

const DESKS = ["News", "Music", "Culture", "Community"];

/**
 * The rail's station promo: a dark photographic panel carrying the wordmark,
 * the positioning line, the desks and a Listen Live action. Fixed black ground
 * (like the hero and the player bar) because the panel is a "media" surface
 * that must not flip to light in dark mode.
 */
export function PromoCard({ className }: PromoCardProps) {
  return (
    <aside
      aria-labelledby="promo-heading"
      className={cn(
        "relative isolate flex min-h-[19rem] overflow-hidden bg-panel text-white",
        className,
      )}
    >
      <Image
        src="/assets/images/prototype-fm-artwork.jpg"
        alt="The Wa skyline at dusk, Prototype Radio artwork"
        fill
        sizes="(max-width: 1023px) 100vw, 366px"
        className="object-cover object-center opacity-75"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/94 via-black/62 to-black/45"
      />

      <div className="relative flex w-full flex-col items-center justify-center gap-5 px-7 py-9 text-center">
        <Wordmark tone="light" />

        <h2
          id="promo-heading"
          className="max-w-[15rem] font-display text-[23px] leading-[1.25] font-bold tracking-[-0.01em] text-white"
        >
          Bringing Ghana closer through sound.
        </h2>

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] text-white/75">
          {DESKS.map((desk, index) => (
            <span key={desk} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-white/35">
                  ·
                </span>
              ) : null}
              <span>{desk}</span>
            </span>
          ))}
        </p>

        <a
          href="#live-player"
          className="mt-1 inline-flex items-center gap-2 rounded-[3px] border border-brand/70 px-4 py-2 text-[12px] font-semibold text-white transition-colors duration-150 hover:border-brand hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <IconWaveform className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
          Listen Live
        </a>
      </div>
    </aside>
  );
}
