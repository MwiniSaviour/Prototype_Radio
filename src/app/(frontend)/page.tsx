import { ArticleGrid } from "@/components/news/ArticleGrid";
import { BreakingNewsTicker } from "@/components/news/BreakingNewsTicker";
import { CategoryNav } from "@/components/news/CategoryNav";
import { ListenAnytime } from "@/components/news/ListenAnytime";
import { LiveBadge } from "@/components/news/LiveBadge";
import { NewsletterRail } from "@/components/news/NewsletterRail";
import { TrendingList } from "@/components/news/TrendingList";
import { ArticleCard } from "@/components/news/ArticleCard";
import { LivePlayerHero } from "@/components/radio/LivePlayerHero";
import { PromoCard } from "@/components/radio/PromoCard";
import { ShowScheduleRail } from "@/components/radio/ShowScheduleRail";
import { TodaysShows } from "@/components/radio/TodaysShows";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getBreakingArticles,
  getCategories,
  getCurrentShow,
  getFeaturedArticles,
  getLatestArticles,
  getLatestEpisodes,
  getNextShow,
  getShowById,
  getTrendingArticles,
} from "@/content";
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
      if (end <= start) end += 24 * 60; // slot crosses midnight
      return minutes >= start && minutes < end;
    }) ?? null
  );
}

export default async function HomePage() {
  const breaking = await getBreakingArticles();
  const [lead, ...restFeatured] = await getFeaturedArticles(3);
  const trending = await getTrendingArticles(5);
  const latest = await getLatestArticles(6);
  const episodes = await getLatestEpisodes(3);
  const categories = await getCategories();

  const episodeItems = await Promise.all(
    episodes.map(async (episode) => ({
      episode,
      show: await getShowById(episode.showId),
    })),
  );

  const liveShow = await getCurrentShow();
  const nextShow = await getNextShow();
  // The hero leads with the live show; when the station is between shows it
  // features the next one instead of inventing a live state.
  const heroShow = liveShow ?? nextShow?.show ?? null;
  const heroSlot = liveShow ? getCurrentSlot(liveShow) : (nextShow?.slot ?? null);

  return (
    <>
      {breaking.length > 0 ? <BreakingNewsTicker articles={breaking} /> : null}

      {/*
        Radio block: live player + schedule rail, today's shows + promo,
        podcasts + newsletter — three rows on one two-column grid, the layout
        of the editorial reference. The newsroom sections follow below so the
        page still reads as a news *and* radio product.
      */}
      <Section containerSize="wide" className="pt-8 sm:pt-10">
        <div className="flex flex-col gap-10 sm:gap-12">
          <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-10">
            {heroShow ? (
              <LivePlayerHero
                show={heroShow}
                slot={heroSlot}
                isLive={Boolean(liveShow)}
              />
            ) : null}
            <ShowScheduleRail />
          </div>

          <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-10">
            <TodaysShows currentShow={liveShow} nextShow={nextShow} />
            <PromoCard />
          </div>

          <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-10">
            <section aria-labelledby="podcasts-heading" className="min-w-0">
              <ListenAnytime
                headingId="podcasts-heading"
                eyebrow={{ muted: "Podcasts", accent: "& Featured" }}
                title="Listen Anytime"
                description="Long listens and extended interviews, whenever you want them."
                action={{ label: "View All Podcasts", href: "/podcasts" }}
                items={episodeItems}
              />
            </section>
            <NewsletterRail />
          </div>
        </div>
      </Section>

      {/* Category rail: persistent navigation into each desk. */}
      <div className="border-y border-line bg-surface py-4">
        <Container>
          <CategoryNav categories={categories} />
        </Container>
      </div>

      {/* Lead: the day's most important story, plus what is moving right now. */}
      <Section aria-labelledby="top-stories-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0">
            <SectionHeading
              as="h2"
              id="top-stories-heading"
              eyebrow="W93.5 FM newsroom"
              title="Top stories"
              className="mb-6"
            />
            <div className="flex flex-col gap-8">
              {lead ? <ArticleCard article={lead} variant="hero" priority /> : null}
              {restFeatured.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {restFeatured.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="default" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside aria-labelledby="trending-heading" className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-card border border-line bg-surface p-5">
              <h2 id="trending-heading" className="font-display text-lg font-bold text-ink">
                Trending now
              </h2>
              <TrendingList articles={trending} className="mt-3" />
            </div>
            <LiveBadge show={liveShow} nextShow={nextShow} className="mt-4" />
          </aside>
        </div>
      </Section>

      <Section aria-labelledby="latest-heading">
        <SectionHeading
          id="latest-heading"
          eyebrow="Fresh from the desk"
          title="Latest stories"
          description="Everything the newsroom filed, newest first."
        />
        <Reveal className="mt-6">
          <ArticleGrid articles={latest} variant="default" columns={3} />
        </Reveal>
      </Section>
    </>
  );
}
