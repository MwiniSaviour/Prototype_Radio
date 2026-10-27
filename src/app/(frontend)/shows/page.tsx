import Link from "next/link";

import { ListenAnytime } from "@/components/news/ListenAnytime";
import { NewsletterRail } from "@/components/news/NewsletterRail";
import { ShowCard } from "@/components/news/ShowCard";
import { ShowSchedule } from "@/components/news/ShowSchedule";
import { LivePlayerHero } from "@/components/radio/LivePlayerHero";
import { PromoCard } from "@/components/radio/PromoCard";
import { ShowScheduleRail } from "@/components/radio/ShowScheduleRail";
import { TodaysShows } from "@/components/radio/TodaysShows";
import { Container } from "@/components/ui/Container";
import { IconArrowRight, IconWaveform } from "@/components/ui/icons";
import {
  getCurrentShow,
  getLatestEpisodes,
  getNextShow,
  getShowById,
  getShows,
} from "@/content";
import type { Show, Weekday } from "@/lib/types";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shows & live radio",
  description:
    "Prototype Radio's live stream and weekly schedule: what is on air in Wa right now, today's shows, the full week and the podcast archive.",
  path: "/shows",
});

const DAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** The slot a show occupies right now — mirrors getCurrentShow()'s boundary logic. */
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
 * The radio page.
 *
 * Three stacked two-column rows — live player + schedule, today's shows +
 * station promo, podcasts + newsletter — then the full week and the roster.
 * The hero leads with the live show, or the next one when the station is
 * between programmes.
 */
export default async function ShowsPage() {
  const [shows, episodes, liveShow, nextShow] = await Promise.all([
    getShows(),
    getLatestEpisodes(3),
    getCurrentShow(),
    getNextShow(),
  ]);

  const episodeItems = await Promise.all(
    episodes.map(async (episode) => ({ episode, show: await getShowById(episode.showId) })),
  );

  const heroShow = liveShow ?? nextShow?.show ?? null;
  const heroSlot = liveShow ? getCurrentSlot(liveShow) : (nextShow?.slot ?? null);

  return (
    <Container className="pt-6 pb-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_366px] lg:gap-[34px]">
        {heroShow ? (
          <LivePlayerHero show={heroShow} slot={heroSlot} isLive={Boolean(liveShow)} />
        ) : null}
        <ShowScheduleRail />
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_366px] lg:gap-[34px]">
        <TodaysShows currentShow={liveShow} nextShow={nextShow} />
        <PromoCard className="lg:mt-[3.25rem]" />
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_366px] lg:gap-[34px]">
        <section aria-labelledby="podcasts-heading" className="min-w-0">
          <ListenAnytime
            headingId="podcasts-heading"
            eyebrow={{ muted: "Podcasts", accent: "& Featured" }}
            title="Listen Anytime"
            action={{ label: "View All Podcasts", href: "/podcasts" }}
            items={episodeItems}
          />
        </section>
        <NewsletterRail className="lg:mt-[3.25rem]" />
      </div>

      {/* The full week + the roster, so the page still answers "who is on when". */}
      <section
        id="schedule"
        aria-labelledby="schedule-heading"
        className="mt-12 scroll-mt-28 border-t border-line pt-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[0.625rem] font-bold tracking-[0.16em] uppercase">
              <IconWaveform className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
              <span className="text-brand">This week</span>
            </p>
            <h2
              id="schedule-heading"
              className="mt-2 font-display text-[28px] leading-[1.08] font-bold tracking-[-0.012em] text-ink sm:text-[32px]"
            >
              Full schedule
            </h2>
          </div>
          <Link
            href="/podcasts"
            className="group flex items-center gap-1.5 pb-1 text-[11.5px] font-semibold text-muted transition-colors hover:text-brand"
          >
            Catch up on podcasts
            <IconArrowRight
              className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
        <ShowSchedule shows={shows} className="mt-5" />
      </section>

      <section aria-labelledby="roster-heading" className="mt-12 border-t border-line pt-8">
        <h2
          id="roster-heading"
          className="font-display text-[28px] leading-[1.08] font-bold tracking-[-0.012em] text-ink sm:text-[32px]"
        >
          Every show
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          {shows.length} programmes a week, every one made in-house in Wa.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} className="h-full scroll-mt-32" />
          ))}
        </div>
      </section>
    </Container>
  );
}
