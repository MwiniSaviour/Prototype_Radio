import Image from "next/image";
import Link from "next/link";
import type { Show } from "@/lib/types";
import { stations } from "@/data";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconClock, IconPlay } from "@/components/ui/icons";
import { formatClock } from "@/lib/format";
import { Waveform } from "@/components/radio/Waveform";

/**
 * The rail's on-air card: a framed panel that names what is playing, shows the
 * studio photograph, and puts the play control next to the dial position. The
 * control links through to the radio page rather than starting a second audio
 * engine, so there is exactly one place that owns playback (the footer bar).
 */
export function OnAirCard({
  show,
  slot,
  isLive,
  className,
}: {
  show: Show;
  slot: { start: string; end: string } | null;
  isLive: boolean;
  className?: string;
}) {
  const station = stations[0];

  return (
    <section
      aria-labelledby="on-air-heading"
      className={cn("border border-line bg-surface", className)}
    >
      <div className="p-4">
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] uppercase">
          <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-brand" />
          <span className="text-ink">{isLive ? "On air now" : "Up next"}</span>
        </p>

        <div className="relative mt-3 aspect-[334/132] w-full overflow-hidden bg-panel">
          <Image
            src={show.image.src}
            alt={show.image.alt}
            fill
            sizes="(max-width: 1023px) 100vw, 366px"
            className="object-cover"
          />
        </div>

        <h2
          id="on-air-heading"
          className="mt-3 font-display text-[21px] leading-tight font-bold tracking-[-0.01em] text-ink"
        >
          <Link href="/shows" className="transition-colors hover:text-brand">
            {show.name}
          </Link>
        </h2>

        <p className="mt-1 text-[13px] leading-[1.45] text-muted">{show.tagline}</p>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/shows"
            aria-label={`Listen live${slot ? ` — ${show.name}` : ""}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <IconPlay className="h-[18px] w-[18px] translate-x-px" aria-hidden="true" />
          </Link>

          <Waveform playing={false} bars={44} className="h-7 min-w-0 flex-1" />
        </div>

        <p className="mt-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          <span>{station.frequency}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5 text-brand">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
            {isLive ? "Live" : "Starts soon"}
          </span>
          {slot ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 normal-case">
                <IconClock className="h-3 w-3" aria-hidden="true" />
                {formatClock(slot.start)}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <Link
        href="/shows"
        className="group flex items-center gap-2 border-t border-line px-4 py-3 text-[11.5px] font-semibold text-brand transition-colors hover:text-brand-hover"
      >
        View schedule
        <IconArrowRight
          className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
