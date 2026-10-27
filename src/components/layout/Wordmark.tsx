import { cn } from "@/lib/utils";

/**
 * The Prototype wordmark: five rounded waveform bars + the PROTOTYPE / RADIO
 * lock-up — the same mark the Capacitor app draws (apps/mobile/src/components/
 * ui/PulseLogo.tsx), so the two surfaces read as one brand.
 *
 * Inline SVG, not a raster asset: the mark stays crisp at every density and can
 * flip to white over imagery (onboarding, dark hero, player bar).
 */
export function Wordmark({
  tone = "ink",
  className,
  compact = false,
}: {
  /** `light` inverts the lettering for dark grounds. */
  tone?: "ink" | "light";
  className?: string;
  /** Hide the "RADIO" line on tight mobile headers. */
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
      <svg
        viewBox="0 0 34 30"
        className="h-7 w-auto shrink-0 sm:h-8"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="#fc5303">
          <rect x="0" y="12" width="3.1" height="6" rx="1.55" />
          <rect x="6.1" y="8.4" width="3.7" height="13.2" rx="1.85" />
          <rect x="13.1" y="0" width="4.2" height="30" rx="2.1" />
          <rect x="20.6" y="8.4" width="3.7" height="13.2" rx="1.85" />
          <rect x="27.5" y="12" width="3.1" height="6" rx="1.55" />
        </g>
      </svg>

      <span className="flex flex-col">
        <span
          className={cn(
            "text-[19px] leading-none font-extrabold tracking-[0.02em] uppercase sm:text-[22px]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          Prototype
        </span>
        {compact ? null : (
          <span
            className={cn(
              "mt-[3px] text-[8px] leading-none font-semibold tracking-[0.46em] uppercase sm:text-[9px]",
              tone === "light" ? "text-white/90" : "text-ink",
            )}
          >
            Radio
          </span>
        )}
      </span>
    </span>
  );
}
