import { Icon } from "~/components/ui/Icon";
import { Waveform } from "~/components/ui/Waveform";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import type { Show } from "@shared/lib/types";

/**
 * "Trending Now": a show row from the shared shows fixture — cover art, show
 * name, presenter ("with …") and today's slot — with the waveform button that
 * starts the station.
 */
export function TrendingShowRow({
  show,
  onPlay,
  playing,
}: {
  show: Show;
  onPlay: () => void;
  playing: boolean;
}) {
  const slot = show.schedule[0];
  const presenter = show.hosts.map((host) => host.name).join(" & ");

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface/70 p-2">
      <span className="relative block h-[68px] w-[76px] shrink-0 overflow-hidden rounded-[10px] bg-media">
        <img
          src={mediaUrl(show.image.src)}
          alt={show.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {show.name}
        </p>
        {presenter ? (
          <p className="mt-[3px] truncate text-[12.5px] leading-snug text-muted">with {presenter}</p>
        ) : null}
        {slot ? (
          <p className="mt-[4px] flex items-center gap-1 text-[12px] leading-snug text-muted">
            <Icon name="clock" size={12} className="shrink-0 text-muted" />
            {clock(slot.start)} – {clock(slot.end)}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onPlay}
        aria-label={playing ? `Pause ${show.name}` : `Listen to ${show.name}`}
        className="mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-95"
      >
        <Waveform
          bars={8}
          height={20}
          animated
          className="text-brand"
          color={playing ? "#FC5303" : "#FC5303"}
        />
      </button>
    </div>
  );
}
