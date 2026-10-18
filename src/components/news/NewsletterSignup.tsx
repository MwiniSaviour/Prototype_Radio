"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconMail } from "@/components/ui/icons";

export interface NewsletterSignupProps {
  className?: string;
  heading?: string;
  description?: string;
}

/**
 * Client-side form with local validation only.
 * STUB: no subscription endpoint is wired up yet — when the backend
 * integration lands, replace the setTimeout with the real API call and keep
 * the status region for the success/failure message.
 */
export function NewsletterSignup({
  className,
  heading = "The 93.5 briefing",
  description = "One email each weekday morning: what we reported overnight and what is on air today.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");

  return (
    <section
      aria-labelledby="newsletter-heading"
      className={cn("rounded-card border border-line bg-surface-2 p-6 sm:p-8", className)}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-fg">
            <IconMail className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="newsletter-heading" className="mt-3 font-display text-xl font-bold text-ink">
            {heading}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        </div>

        {status === "done" ? (
          <p role="status" className="text-sm font-semibold text-brand">
            Thanks — check {email} to confirm.
          </p>
        ) : (
          <form
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setStatus("done");
            }}
          >
            <Input
              type="email"
              required
              label={`Email address (${siteConfig.name} briefing)`}
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="sm:mb-0">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
