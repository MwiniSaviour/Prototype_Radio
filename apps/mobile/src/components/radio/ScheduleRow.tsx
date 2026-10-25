import { LivePill } from "~/components/ui/primitives";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import type { ScheduledProgramme } from "~/lib/schedule";

/**
 * A row in the broadcast schedule. It keeps the "All Stations" row design the
 * app already had — artwork tile, title block, slot — with the programme's own
 * name and presenter in place of the dial copy.
 *
 * There is no play control: the live stream is one continuous feed, so a row is
 * only ever a listing. Playing a programme "on demand" is not something the app
 * can do, and a button that did nothing on 90% of the rows would be a lie. The
 * banner on the Live Radio page owns the one play action.
 */
export function ScheduleRow({ programme }: { programme: ScheduledProgramme }) {
  const { show, slot, live } = programme;

  // Lead presenter plus a count: two full names never fit beside the artwork
  // and the slot at 390px.
  const lead = show.hosts[0]?.name ?? "Prototype FM";
  const extra = show.hosts.length - 1;
  const presenter = extra > 0 ? `${lead} +${extra}` : lead;

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[15px] border p-2.5",
        live ? "border-brand/35 bg-brand-soft/50" : "border-line/90 bg-surface/70",
      )}
    >
      <span className="relative block h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[12px] bg-media">
        <img
          src={mediaUrl(show.image.src)}
          alt={show.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
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
    </div>
  );
}
