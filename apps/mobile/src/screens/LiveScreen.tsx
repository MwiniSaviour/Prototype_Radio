import { BackButton } from "~/components/layout/StatusBar";
import { useGoBack } from "~/lib/navigation";
import { PulseBars } from "~/components/ui/PulseLogo";
import { Icon } from "~/components/ui/Icon";
import { LivePill } from "~/components/ui/primitives";
import { Waveform } from "~/components/ui/Waveform";
import { useContent } from "~/content/ContentProvider";
import { usePlayer } from "~/content/PlayerProvider";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";

/**
 * Live radio. A nested page rather than a tab: it opens from any live-radio item
 * (Home's Up Next rail) and pushes over the tab bar, so it carries its own back
 * affordance. The content is the now-playing panel and every station on the dial.
 */
export function LiveScreen() {
  const goBack = useGoBack();
  const { stations } = useContent();
  const { station, isPlaying, toggle, status, pause } = usePlayer();
  const playingThis = isPlaying && station.id === station?.id;

  return (
    <div className="pb-5">
      <header className="flex items-start gap-2 px-5 pt-2">
        <BackButton tone="dark" onClick={goBack} label="Back" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em] text-ink">
            Live Radio
          </h1>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">Four stations, one dial.</p>
        </div>
      </header>

      <section className="mt-3.5 px-5">
        <div className="relative isolate overflow-hidden rounded-[18px] bg-media p-4 shadow-card">
          <img
            src={mediaUrl(station.artwork.src)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/70 to-black/45" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <LivePill />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
                Now playing
              </span>
            </div>

            <div className="mt-8 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[21px] font-bold leading-tight tracking-[-0.02em] text-white">
                  {station.name}
                </p>
                <p className="mt-1 text-[12.5px] text-white/80">
                  {station.frequency} · {station.city}
                </p>
                <Waveform bars={24} height={16} className="mt-3 text-brand" color="#FC5303" animated />
              </div>
              <button
                type="button"
                onClick={() => toggle(station)}
                aria-label={playingThis ? `Pause ${station.name}` : `Play ${station.name}`}
                className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_10px_24px_-6px_rgb(252_83_3/0.65)] transition active:scale-95"
              >
                <Icon name={playingThis ? "pause" : "play"} size={22} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
        <p aria-live="polite" className="mt-2 min-h-[16px] px-1 text-[11.5px] leading-snug text-muted">
          {status}
        </p>
      </section>

      <section className="mt-2">
        <h2 className="px-5 pt-2 text-[17.5px] font-bold tracking-[-0.015em] text-ink">All Stations</h2>
        <ul className="mt-2.5 space-y-2 px-5">
          {stations.map((item) => {
            const active = item.id === station.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => (active && isPlaying ? pause() : toggle(item))}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-[15px] border p-2.5 text-left transition active:scale-[0.99]",
                    active
                      ? "border-brand/35 bg-brand-soft/50"
                      : "border-line/90 bg-surface/70",
                  )}
                >
                  <span className="relative block h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                    {item.flagship ? (
                      <span className="absolute inset-0 grid place-items-center bg-[#0a0a0b]">
                        <PulseBars height={26} />
                      </span>
                    ) : (
                      <img
                        src={mediaUrl(item.artwork.src)}
                        alt={item.artwork.alt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">{item.name}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {item.frequency} · {item.city}
                    </span>
                    <span className="mt-1 block truncate text-[11.5px] text-muted-soft">{item.tagline}</span>
                  </span>
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      active && isPlaying ? "bg-brand text-white" : "bg-surface-2 text-ink",
                    )}
                  >
                    <Icon name={active && isPlaying ? "pause" : "play"} size={15} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
