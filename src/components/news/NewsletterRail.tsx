"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconInbox } from "@/components/ui/icons";

export interface NewsletterRailProps {
  className?: string;
  heading?: string;
  description?: string;
}

/**
 * Warm rail card that pairs with the episode rows: heading, supporting line, a
 * pill input with a circular brand submit, and a reassurance line.
 *
 * The ground is --color-brand-soft rather than the reference's dark
 * photographic panel: an ink ground would flip to near-white in dark mode,
 * where the brand-red button then loses its boundary against it. The warm tint
 * reads the same in both themes and keeps every text pair above 4.5:1.
 *
 * STUB: no subscription endpoint exists yet — swap the setStatus call for the
 * real API call and keep the status region for the confirmation copy.
 */
export function NewsletterRail({
  className,
  heading = "Stay in the loop",
  description = "Get the latest news, show updates and exclusive episodes in your inbox.",
}: NewsletterRailProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const headingId = useId();
  const emailId = useId();
  const statusId = useId();
  const noteId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-card border border-brand/20 bg-brand-soft p-6 shadow-card sm:p-7",
        className,
      )}
    >
      <h2
        id={headingId}
        className="font-display text-2xl leading-tight font-bold tracking-tight text-ink"
      >
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

      {status === "done" ? (
        <p
          id={statusId}
          role="status"
          className="mt-5 rounded-card border border-brand/25 bg-surface p-4 text-sm text-ink"
        >
          Thanks — check {email} to confirm.
        </p>
      ) : (
        <form
          className="relative mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setStatus("done");
          }}
        >
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="Enter your email address"
            value={email}
            aria-describedby={noteId}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-full border border-line bg-surface pr-14 pl-5 text-sm text-ink transition-colors placeholder:text-muted hover:border-ink/25 focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          <button
            type="submit"
            aria-label="Subscribe to the Radio Waa newsletter"
            className="absolute top-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-fg shadow-card transition-[background-color,transform] duration-150 hover:scale-105 hover:bg-brand-hover focus-visible:focus-ring active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
          >
            <IconArrowRight className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </button>
        </form>
      )}

      <p id={noteId} className="mt-4 flex items-center gap-2 text-xs text-muted">
        <IconInbox className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>No spam</span>
        <span aria-hidden="true">·</span>
        <span>Unsubscribe anytime</span>
      </p>
    </section>
  );
}