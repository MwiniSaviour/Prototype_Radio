import { PulseBars } from "~/components/ui/PulseLogo";
import { LivePill } from "~/components/ui/primitives";
import { mediaUrl } from "~/lib/api";
import type { Station } from "@shared/lib/types";

/**
 * One card in the "Live Radio" rail: square artwork with an optional LIVE pill,
 * then name, dial position and city. The flagship station's artwork is the
 * brand's black-and-orange waveform tile, which the mock shows first.
 */
export function StationCard({
  station,
  onSelect,
}: {
  station: Station;
  onSelect: () => void;
}) {
  const isBrandTile = station.flagship;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-[80px] shrink-0 snap-start text-left transition active:scale-[0.97]"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-[12px] bg-media">
        {isBrandTile ? (
          <span className="absolute inset-0 grid place-items-center bg-[#0a0a0b]">
            <PulseBars height={26} />
          </span>
        ) : (
          <img
            src={mediaUrl(station.artwork.src)}
            alt={station.artwork.alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        )}
        {station.live ? (
          <LivePill size="sm" className="absolute bottom-1.5 left-1.5 z-10" />
        ) : null}
      </span>

      <span className="mt-[7px] block truncate text-[10px] font-semibold leading-tight tracking-[-0.015em] text-ink">
        {station.name}
      </span>
      <span className="mt-[2px] block text-[10px] leading-snug text-muted">{station.frequency}</span>
      <span className="block text-[10px] leading-snug text-muted">{station.city}</span>
    </button>
  );
}
