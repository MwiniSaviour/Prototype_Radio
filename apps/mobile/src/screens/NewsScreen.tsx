import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";
import { timeAgo } from "~/lib/format";
import { breakingStories, latestStories, leadStories } from "~/lib/news";
import type { Article } from "@shared/lib/types";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * News: the newsroom screen from the reference design, laid out for a phone.
 *
 * The breaking strip rotates through the flagged stories, the lead story with
 * its headline and deck is a swipeable carousel of the editor's picks, and "The
 * latest" stacks the remaining stories full width so the deck copy still reads
 * at 390px.
 */
export function NewsScreen() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const listed = showAll ? latestStories : latestStories.slice(0, 5);

  return (
    <div className="pb-6">
      <h1 className="sr-only">News</h1>
      <BreakingStrip onOpen={(slug) => navigate(`/news/${slug}`)} />
      <LeadCarousel onOpen={(slug) => navigate(`/news/${slug}`)} />

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3 border-t border-line-strong/70 px-5 pt-4">
          <h2 className="font-display text-[25px] font-bold leading-none tracking-[-0.015em] text-ink">
            The latest
          </h2>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="flex shrink-0 items-center gap-1 pb-[3px] text-[11.5px] font-semibold text-ink/75 transition active:opacity-60"
          >
            {showAll ? "Show less" : "View all news"}
            <Icon name="arrow-right" size={13} className="translate-y-[0.5px]" />
          </button>
        </div>

        <ul className="mt-4 px-5">
          {listed.map((article) => (
            <li key={article.id} className="border-b border-line pb-6 pt-5 first:pt-0 last:border-b-0 last:pb-0">
              <LatestStory article={article} onOpen={() => navigate(`/news/${article.slug}`)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Red breaking bar: rotates through the flagged stories, tappable. */
function BreakingStrip({ onOpen }: { onOpen: (slug: string) => void }) {
  const [index, setIndex] = useState(0);
  const story = breakingStories[index] ?? breakingStories[0];

  useEffect(() => {
    // One flagged story means nothing to rotate through.
    if (breakingStories.length < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(
      () => setIndex((value) => (value + 1) % breakingStories.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, []);

  if (!story) return null;

  return (
    <div className="flex items-stretch gap-3 border-y border-line bg-surface-2/60 px-5 py-2.5">
      <span className="flex shrink-0 items-center rounded-[3px] bg-brand px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">
        Breaking
      </span>
      <button
        type="button"
        onClick={() => onOpen(story.slug)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="line-clamp-2 text-[12px] font-medium leading-[1.35] text-ink">
          {story.title}
        </span>
        {breakingStories.length > 1 ? (
          <span className="shrink-0 self-center text-[9.5px] font-semibold tabular-nums text-ink/45">
            {index + 1}/{breakingStories.length}
          </span>
        ) : null}
        <Icon name="arrow-right" size={14} className="shrink-0 self-center text-ink/60" />
      </button>
    </div>
  );
}

/** The lead story and its deck, one slide per editor's pick. */
function LeadCarousel({ onOpen }: { onOpen: (slug: string) => void }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const stories = leadStories;
  const pausedRef = useRef(0);

  const goTo = (next: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({
      left: next * rail.clientWidth,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  };

  // Advance on its own, the way the reference's banner rotates — but never
  // against someone's explicit choice, and never when motion is reduced.
  useEffect(() => {
    if (stories.length < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (Date.now() - pausedRef.current < 12_000) return;
      if (document.visibilityState !== "visible") return;
      setIndex((current) => {
        const next = (current + 1) % stories.length;
        goTo(next);
        return next;
      });
    }, 7000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories.length]);

  return (
    <section aria-label="Lead stories" className="pt-4">
      <div
        ref={railRef}
        onScroll={(event) => {
          const rail = event.currentTarget;
          if (!rail.clientWidth) return;
          setIndex(Math.round(rail.scrollLeft / rail.clientWidth));
        }}
        onPointerDown={() => {
          pausedRef.current = Date.now();
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {stories.map((article, position) => (
          <article key={article.id} className="w-full shrink-0 snap-center px-5">
            <button
              type="button"
              onClick={() => onOpen(article.slug)}
              className="block w-full text-left"
            >
              <div className="relative -mx-5 aspect-[16/10] w-[calc(100%+2.5rem)] overflow-hidden bg-media">
                <img
                  src={mediaUrl(article.image.src)}
                  alt={article.image.alt}
                  className="h-full w-full object-cover"
                  loading={position === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </div>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                The big story
              </p>
              <h2 className="mt-1.5 font-display text-[27px] font-bold leading-[1.1] tracking-[-0.01em] text-ink">
                {article.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-[13.5px] leading-[1.5] text-muted">
                {article.excerpt}
              </p>
              <p className="mt-2.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink/55">
                Prototype newsroom · {timeAgo(article.publishedAt)}
              </p>
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {stories.map((article, position) => (
          <button
            key={article.id}
            type="button"
            aria-label={`Lead story ${position + 1} of ${stories.length}`}
            aria-current={position === index ? "true" : undefined}
            onClick={() => {
              pausedRef.current = Date.now();
              setIndex(position);
              goTo(position);
            }}
            className={cn(
              "h-[5px] rounded-full transition-all",
              position === index ? "w-[18px] bg-brand" : "w-[5px] bg-ink/18",
            )}
          />
        ))}
      </div>
    </section>
  );
}

/** One row in "The latest": artwork, category, serif headline, deck, stamp. */
function LatestStory({ article, onOpen }: { article: Article; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <div className="aspect-[16/9] w-full overflow-hidden bg-media">
        <img
          src={mediaUrl(article.image.src)}
          alt={article.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </div>
      <p className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand">
        {article.category.name}
      </p>
      <h3 className="mt-1 font-display text-[19px] font-bold leading-[1.18] tracking-[-0.01em] text-ink">
        {article.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.5] text-muted">{article.excerpt}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        {timeAgo(article.publishedAt)}
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-ink/30" />
        {article.readingMinutes} min read
      </p>
    </button>
  );
}
