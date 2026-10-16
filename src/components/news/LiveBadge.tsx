import type { Show, ShowSlot } from "@/lib/types";
import { siteConfig } from "@/lib/constants";
import { getNextShow } from "@/content";
import { formatClock } from "@/lib/format";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { cn } from "@/lib/utils";

export interface LiveBadgeProps {
  show: Show | null;
  /** Resolved by the page that already knows the on-air state; omitted callers fall back to the content layer. */
  nextShow?: { show: Show; slot: ShowSlot } | null;
  className?: string;
}

/**
 * "Who is on air right now" badge for the homepage. When off air it names the
 * next show and its start time instead of inventing a live state.
 */
export async function LiveBadge({ show, nextShow, className }: LiveBadgeProps) {
  if (show) {
    return (
      <div
        className={cn(
          "inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-line bg-surface px-4 py-2",
          className,
        )}
      >
        <LiveIndicator label="On air now" />
        <span className="text-sm font-semibold text-ink">{show.name}</span>
        <span className="text-xs text-muted">with {show.hosts.map((host) => host.name).join(" & ")}</span>
      </div>
    );
  }

  const next = nextShow !== undefined ? nextShow : await getNextShow();
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-line bg-surface px-4 py-2",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Off air</span>
      <span className="text-sm text-muted">
        {next ? (
          <>
            Back with <span className="font-semibold text-ink">{next.show.name}</span> at{" "}
            {formatClock(next.slot.start)}
          </>
        ) : (
          <>See the full {siteConfig.name} schedule</>
        )}
      </span>
    </div>
  );
}
