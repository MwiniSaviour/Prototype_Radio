import { cn } from "@/lib/utils";

export interface WaveformProps {
  /** How many bars to render. More bars are simply clipped on narrow screens. */
  bars?: number;
  /** When true the bars pulse — motion-safe only. */
  playing?: boolean;
  className?: string;
}

/**
 * Deterministic bar heights so server and client render identical markup.
 * Two out-of-phase sines give the irregular "live audio" rhythm without
 * Math.random(), which would cause hydration mismatches.
 */
function barHeight(index: number): number {
  const primary = Math.sin(index * 0.9 + 0.6);
  const secondary = Math.sin(index * 2.3 + 1.7);
  return 0.3 + (Math.abs(primary) * 0.5 + Math.abs(secondary) * 0.5) * 0.7;
}

/**
 * The hero's waveform visualiser. Decorative: the neighbouring play button's
 * aria-pressed state carries the same information for assistive tech.
 */
export function Waveform({ bars = 56, playing = false, className }: WaveformProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex h-9 min-w-0 items-center gap-[3px] overflow-hidden", className)}
    >
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          style={{
            height: `${Math.round(barHeight(index) * 100)}%`,
            opacity: index < bars * 0.55 ? 1 : 0.35,
            animationDelay: `${(index % 7) * 90}ms`,
            animationDuration: `${900 + (index % 5) * 120}ms`,
          }}
          className={cn(
            "w-[3px] shrink-0 rounded-full bg-brand",
            playing && "motion-safe:animate-eq-bar",
          )}
        />
      ))}
    </span>
  );
}
