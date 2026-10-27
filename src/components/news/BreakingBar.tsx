"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconChevronRight } from "@/components/ui/icons";
import { Container } from "@/components/ui/Container";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The breaking strip under the masthead: a solid brand tag, the headline, an
 * arrow into the story, and prev/next controls when there is more than one
 * flagged article. It rotates politely — paused under reduced motion.
 */
export function BreakingBar({ articles, className }: { articles: Article[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const count = articles.length;

  useEffect(() => {
    if (count < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % count), 7000);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const article = articles[index % count];

  const step = (delta: number) => setIndex((value) => (value + delta + count) % count);

  return (
    <div className={cn("border-b border-line/80", className)}>
      <Container className="flex min-h-[44px] items-center gap-4">
        <span className="shrink-0 bg-brand px-2.5 py-[5px] text-[10px] font-bold tracking-[0.16em] text-white uppercase">
          Breaking
        </span>

        <Link
          href={`/article/${article.slug}`}
          className="group flex min-w-0 flex-1 items-center gap-2 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:text-brand"
        >
          <span className="truncate">{article.title}</span>
          <IconArrowRight
            className="h-3.5 w-3.5 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>

        {count > 1 ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-2 hidden text-[10.5px] tabular-nums text-muted-soft sm:inline">
              {index + 1}/{count}
            </span>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous breaking story"
              className="grid h-7 w-7 place-items-center text-ink/60 transition-colors hover:text-ink"
            >
              <IconChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next breaking story"
              className="grid h-7 w-7 place-items-center text-ink/60 transition-colors hover:text-ink"
            >
              <IconChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
