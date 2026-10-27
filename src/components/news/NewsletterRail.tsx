"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconInbox } from "@/components/ui/icons";

export interface NewsletterRailProps {
  className?: string;
  heading?: string;
  description?: string;
}

/**
 * The rail's newsletter card: warm paper ground with a soft photographic
 * texture, the serif heading, a supporting line, a pill input with a circular
 * brand submit, and a reassurance line.
 *
 * STUB: no subscription endpoint exists yet — swap the setStatus call for the
 * real API call and keep the status region for the confirmation copy.
 */
export function NewsletterRail({
  className,
  heading = "Stay in the loop",
  description = "Get the latest news, show updates and exclusive content in your inbox.",
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
        "relative isolate overflow-hidden border border-line bg-surface-2/70 p-5 sm:p-6",
        className,
      )}
    >
      <Image
        src="/assets/images/pulse-event-sunset-live.jpg"
        alt=""
        aria-hidden="true"
        fill
        sizes="(max-width: 1023px) 100vw, 366px"
        className="pointer-events-none object-cover opacity-20"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-paper via-paper/85 to-paper/40"
      />

      <div className="relative">
        <h2
          id={headingId}
          className="font-display text-[23px] leading-tight font-bold tracking-[-0.01em] text-ink"
        >
          {heading}
        </h2>
        <p className="mt-1.5 max-w-[19rem] text-[12.5px] leading-[1.5] text-muted">{description}</p>

        {status === "done" ? (
          <p
            id={statusId}
            role="status"
            className="mt-4 border border-brand/25 bg-surface p-3.5 text-[12.5px] text-ink"
          >
            You are on the list — the next edition lands on Friday.
          </p>
        ) : (
          <form
            className="relative mt-4"
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
              className="h-11 w-full rounded-[3px] border border-line bg-surface pr-12 pl-3.5 text-[12.5px] text-ink transition-colors placeholder:text-muted-soft hover:border-line-strong focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            />
            <button
              type="submit"
              aria-label="Subscribe to the Prototype Radio newsletter"
              className="absolute top-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-hover focus-visible:focus-ring"
            >
              <IconArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        )}

        <p id={noteId} className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted-soft">
          <IconInbox className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>No spam</span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <span>Unsubscribe anytime</span>
        </p>
      </div>
    </section>
  );
}
