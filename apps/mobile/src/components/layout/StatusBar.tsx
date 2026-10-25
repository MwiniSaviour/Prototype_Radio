import { cn } from "~/lib/cn";
import { Icon } from "~/components/ui/Icon";

/**
 * The iOS status bar, drawn for the browser preview only.
 *
 * On a real device the OS owns this strip — the native build hides it here and
 * pads with the safe-area inset instead — but in a desktop preview the mock's
 * 9:41 / signal / battery row is part of the composition being reviewed.
 */
export function StatusBar({
  className,
  tone = "ink",
}: {
  className?: string;
  /** "light" is for screens that open over full-bleed artwork (onboarding). */
  tone?: "ink" | "light";
}) {
  const fg = tone === "light" ? "text-white" : "text-ink";
  return (
    <div
      className={cn("flex h-[42px] shrink-0 items-center justify-between px-5 pt-1 select-none", className)}
      aria-hidden="true"
    >
      <span className={cn("text-[14.5px] font-semibold tracking-[-0.01em]", fg)}>9:41</span>
      <span className="h-[19px] w-[19px] rounded-full bg-[#0b0b0c]" />
      <span className={cn("flex items-center gap-[5px]", fg)}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden="true">
          <rect x="0" y="7.5" width="3" height="3.5" rx="1" fill="currentColor" />
          <rect x="4.6" y="5.4" width="3" height="5.6" rx="1" fill="currentColor" />
          <rect x="9.2" y="3" width="3" height="8" rx="1" fill="currentColor" />
          <rect x="13.8" y="0.4" width="3" height="10.6" rx="1" fill="currentColor" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path
            d="M8 10.6a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Z"
            fill="currentColor"
          />
          <path
            d="M2.2 6.1a8.2 8.2 0 0 1 11.6 0M4.7 8.1a4.7 4.7 0 0 1 6.6 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="flex items-center gap-[2px]">
          <span className={cn("relative block h-[11.5px] w-[23px] rounded-[3.5px] border p-[1.5px]", tone === "light" ? "border-white/45" : "border-ink/40")}>
            <span className={cn("block h-full w-[75%] rounded-[2px]", tone === "light" ? "bg-white" : "bg-ink")} />
          </span>
          <span className={cn("block h-[4px] w-[1.5px] rounded-r", tone === "light" ? "bg-white/45" : "bg-ink/40")} />
        </span>
      </span>
    </div>
  );
}

/** A back affordance that matches the mock's plain chevron in a soft circle. */
export function BackButton({
  onClick,
  tone = "light",
  label = "Go back",
}: {
  onClick: () => void;
  tone?: "light" | "dark";
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full transition active:scale-95",
        tone === "light"
          ? "text-white [filter:drop-shadow(0_1px_5px_rgb(0_0_0/0.55))]"
          : "bg-surface/85 text-ink ring-1 ring-line",
      )}
    >
      <Icon name="chevron-left" size={21} />
    </button>
  );
}
