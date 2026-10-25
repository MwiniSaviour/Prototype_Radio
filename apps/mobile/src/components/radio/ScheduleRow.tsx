import type { Station } from "@shared/lib/types";
import { Icon } from "~/components/ui/Icon";
import { LivePill } from "~/components/ui/primitives";
import { PulseBars } from "~/components/ui/PulseLogo";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import type { ScheduledProgramme } from "~/lib/schedule";

/**
 * A row in a broadcast schedule. It keeps the "All Stations" row design the
 * app already had — station tile art, the title block, a round play button —
 * with the programme's own name, slot and presenter in place of the dial copy.
 */
export function ScheduleRow({
  programme,
  artwork,
  playing = false,
  onPlay,
  onOpen,
}: {
  programme: ScheduledProgramme;
  artwork?: Station;
  playing?: boolean;
  onPlay: () => void;
  onOpen?: () => void;
}) {
  const { show, slot, live } = programme;
  // Lead presenter plus a count: two full names never fit beside the artwork,
  // the slot and the play button at 390px.
  const lead = show.hosts[0]?.name ?? "Prototype Radio";
  const extra = show.hosts.length - 1;
  const presenter = extra > 0 ? `${lead} +${extra}` : lead;
  const presenterLabel = show.hosts.map((host) => host.name).join(" & ");

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[15px] border p-2.5 transition",
        live ? "border-brand/35 bg-brand-soft/50" : "border-line/90 bg-surface/70",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left active:opacity-70"
        aria-label={`${show.name}, ${clock(slot.start)} to ${clock(slot.end)}, presented by ${presenterLabel}`}
      >
        <span className="relative block h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[12px] bg-media">
          {artwork?.flagship ? (
            <span className="absolute inset-0 grid place-items-center bg-[#0a0a0b]">
              <PulseBars height={24} />
            </span>
          ) : artwork ? (
            <img
              src={mediaUrl(artwork.artwork.src)}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-bold tabular-nums tracking-[0.01em] text-brand">
              {clock(slot.start)} – {clock(slot.end)}
            </span>
            {live ? <LivePill size="sm" /> : null}
          </span>
          <span className="mt-0.5 block truncate text-[14.5px] font-semibold text-ink">
            {show.name}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-soft">
            {presenter}
            {extra > 0 ? (
              <span className="sr-only"> with {show.hosts.slice(1).map((h) => h.name).join(" and ")}</span>
            ) : null}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onPlay}
        aria-label={playing ? `Pause ${show.name}` : `Listen to ${show.name}`}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-95",
          playing ? "bg-brand text-white" : "bg-surface-2 text-ink",
        )}
      >
        <Icon name={playing ? "pause" : "play"} size={15} />
      </button>
    </div>
  );
}
