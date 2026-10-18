import Image from "next/image";
import { cn } from "@/lib/utils";
import { IconWaveform } from "@/components/ui/icons";

export interface PromoCardProps {
  className?: string;
}

const DESKS = ["News", "Politics", "Business", "Sports"];

/**
 * The rail's station promo: dark photographic panel with the wordmark lockup,
 * the positioning line and a Listen Live button that jumps back to the hero
 * player. Fixed black ground (like the hero) because the panel is a "media"
 * surface that must not flip to light in dark mode.
 */
export function PromoCard({ className }: PromoCardProps) {
  return (
    <aside
      aria-labelledby="promo-heading"
      className={cn(
        "relative isolate flex min-h-[22rem] overflow-hidden rounded-card bg-black text-white",
        className,
      )}
    >
      <Image
        src="/assets/images/cover-hottest-mic.svg"
        alt="Studio microphone artwork from the Hottest Mic show cover, drawn in the W93.5 FM palette"
        fill
        sizes="(max-width: 1279px) 100vw, 21rem"
        className="object-cover object-center opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/75"
      />

      <div className="relative flex w-full flex-col items-center justify-center gap-5 p-6 text-center sm:p-8">
        <p className="flex items-center gap-2.5">
          <IconWaveform className="h-7 w-7 text-brand" aria-hidden="true" />
          <span className="font-display text-2xl leading-none font-extrabold tracking-tight text-white">
            W93.5 FM
          </span>
        </p>

        <h2
          id="promo-heading"
          className="max-w-[17rem] font-display text-2xl leading-snug font-bold tracking-tight text-white"
        >
          Bringing the Upper West closer through sound.
        </h2>

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.8125rem] text-white/80">
          {DESKS.map((desk, index) => (
            <span key={desk} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-white/40">
                  •
                </span>
              ) : null}
              <span>{desk}</span>
            </span>
          ))}
        </p>

        <a
          href="#live-player"
          className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:border-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <IconWaveform className="h-4 w-4 text-brand" aria-hidden="true" />
          Listen Live
        </a>
      </div>
    </aside>
  );
}
