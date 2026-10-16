import { cn } from "@/lib/utils";

/**
 * Inline wordmark: a broadcast icon (carrier dot + radiating waves) plus the
 * station name. Inline SVG avoids a dependency on the logo asset, which the
 * design-assets agent may later drop into public/assets/logo/.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0 text-brand"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="16" cy="16" r="15" fill="currentColor" />
        <circle cx="16" cy="16" r="2.5" fill="var(--color-paper)" />
        <path
          d="M16 9.5A6.5 6.5 0 0 1 16 22.5"
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M16 5A11 11 0 0 1 16 27"
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="2.1"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
      <span className="font-display text-xl leading-none font-extrabold tracking-tight text-ink">
        Radio<span className="text-brand">Waa</span>
      </span>
    </span>
  );
}
