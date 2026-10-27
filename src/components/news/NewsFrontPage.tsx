import Image from "next/image";
import Link from "next/link";

import { BigStory } from "@/components/news/BigStory";
import { BreakingBar } from "@/components/news/BreakingBar";
import { LatestStories } from "@/components/news/LatestStories";
import { MostRead } from "@/components/news/MostRead";
import { RegionList } from "@/components/news/RegionList";
import { OnAirCard } from "@/components/radio/OnAirCard";
import { Container } from "@/components/ui/Container";
import {
  getBreakingArticles,
  getCurrentShow,
  getFeaturedArticles,
  getLatestArticles,
  getNextShow,
  getTrendingArticles,
} from "@/content";
import { formatRelativeTime } from "@/lib/format";
import type { Show, Weekday } from "@/lib/types";

const DAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** The slot a show occupies right now — mirrors the boundary logic in getCurrentShow(). */
function getCurrentSlot(show: Show, now: Date = new Date()): Show["schedule"][number] | null {
  const day = DAY_ORDER[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (
    show.schedule.find((slot) => {
      if (slot.day !== day) return false;
      const [startHours, startMinutes] = slot.start.split(":").map(Number);
      const [endHours, endMinutes] = slot.end.split(":").map(Number);
      const start = startHours * 60 + startMinutes;
      let end = endHours * 60 + endMinutes;
      if (end <= start) end += 24 * 60;
      return minutes >= start && minutes < end;
    }) ?? null
  );
}

/**
 * The newsroom front page — the site's landing screen.
 *
 * A newspaper grid: one lead story at the top of the main column, three latest
 * stories beneath it, and a rail carrying what is on air, what is being read and
 * the coverage index. Every block is fed by the same Payload-backed content as
 * the app — there is no second copy of the newsroom.
 *
 * Rendered by both `/` (canonical) and `/news`, so the landing URL and the
 * News section are the same page rather than two editions.
 */
export async function NewsFrontPage() {
  const [featured, latest, trending, breaking] = await Promise.all([
    getFeaturedArticles(4),
    getLatestArticles(9),
    getTrendingArticles(5),
    getBreakingArticles(),
  ]);

  const [lead] = featured;
  // The lead must not repeat inside the latest row.
  const latestWithoutLead = latest.filter((article) => article.id !== lead?.id);
  const latestCards = latestWithoutLead.slice(0, 3);
  const moreStories = latestWithoutLead.slice(3, 8);

  const liveShow = await getCurrentShow();
  const nextShow = await getNextShow();
  const heroShow = liveShow ?? nextShow?.show ?? null;
  const heroSlot = liveShow ? getCurrentSlot(liveShow) : (nextShow?.slot ?? null);

  return (
    <>
      {/* The page's heading: the edition is the News front page, as it is in the app. */}
      <h1 className="sr-only">News</h1>
      {breaking.length > 0 ? <BreakingBar articles={breaking} /> : null}

      <Container className="pt-6 pb-12 sm:pt-7">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_366px] lg:gap-[34px]">
          <div className="min-w-0">
            {lead ? <BigStory article={lead} /> : null}

            <LatestStories articles={latestCards} />

            {moreStories.length > 0 ? (
              <section aria-labelledby="more-heading" className="mt-9 border-t border-line pt-5">
                <h2
                  id="more-heading"
                  className="font-display text-[26px] leading-none font-bold tracking-[-0.01em] text-ink"
                >
                  More from the newsroom
                </h2>

                <ul className="mt-4 divide-y divide-line">
                  {moreStories.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/article/${article.slug}`}
                        className="group flex items-start gap-4 py-4 transition-colors"
                      >
                        <span className="relative h-[68px] w-[96px] shrink-0 overflow-hidden bg-surface-2">
                          <Image
                            src={article.image.src}
                            alt={article.image.alt}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold tracking-[0.14em] text-brand uppercase">
                            {article.category.name}
                          </span>
                          <span className="mt-1 block font-display text-[16.5px] leading-snug font-bold text-ink transition-colors group-hover:text-brand">
                            {article.title}
                          </span>
                          <span className="mt-1 block text-[11px] tracking-[0.1em] text-muted-soft uppercase">
                            {formatRelativeTime(article.publishedAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-7" aria-label="Live radio, most read and coverage">
            {heroShow ? (
              <OnAirCard show={heroShow} slot={heroSlot} isLive={Boolean(liveShow)} />
            ) : null}

            <MostRead articles={trending} />
            <RegionList />
          </aside>
        </div>
      </Container>
    </>
  );
}
