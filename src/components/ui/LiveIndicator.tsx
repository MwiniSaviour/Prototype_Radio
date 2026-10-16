import { cn } from "@/lib/utils";

export interface LiveIndicatorProps {
  label?: string;
  className?: string;
}

/**
 * "On air" indicator. The dot pulse is motion-safe, and the state is carried by
 * text (not colour alone) so it survives greyscale and accessibility audits.
 */
export function LiveIndicator({ label = "Live", className }: LiveIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-brand opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
        {label}
      </span>
    </span>
  );
}
