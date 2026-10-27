import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ListenAnytime, type ListenAnytimeItem } from "@/components/news/ListenAnytime";
import { NewsletterRail } from "@/components/news/NewsletterRail";
import { PodcastRow } from "@/components/news/PodcastRow";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getEpisodesByShow,
  getLatestEpisodes,
  getPodcastEpisodes,
  getShowById,
  getShows,
} from "@/content";
import { pluralize } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Podcasts",
  description:
    "Listen back to every Radio Waa series: documentaries, extended interviews and the full Signal & Noise archive.",
  path: "/podcasts",
});

export default async function PodcastsPage() {
  const shows = await getShows();
  const episodeCount = (await getPodcastEpisodes()).length;

  const series = (
    await Promise.all(
      shows.map(async (show) => ({ show, episodes: await getEpisodesByShow(show.id) })),
    )
  ).filter((entry) => entry.episodes.length > 0);

  const featured: ListenAnytimeItem[] = await Promise.all(
    (await getLatestEpisodes(6)).map(async (episode) => ({
      episode,
      show: await getShowById(episode.showId),
    })),
  );

  return (
    <>
      <Container className="pt-5 pb-6">
        <Breadcrumbs items={[{ label: "Podcasts" }]} />

        <header className="max-w-2xl">
          <h1 className="font-display text-[32px] leading-[1.1] font-bold tracking-[-0.012em] text-ink sm:text-[40px]">
            Podcasts
          </h1>
          <p className="mt-2.5 text-[14px] leading-[1.55] text-muted">
            {pluralize(episodeCount, "episode")} across{" "}
            {pluralize(series.length, "series")}. Every episode is free to listen to
            and share — no account, no app required.
          </p>
        </header>
      </Container>

      {/*
        The rail only appears from 1440px up. Below that the episode grid needs
        the full width: a 3-up row card with a 80px cover and a 40px play button
        already leaves ~140px for the headline, and any less wraps it badly.
      */}
      <Section containerSize="wide" className="pt-2">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_366px] xl:gap-[34px]">
          <section aria-labelledby="listen-anytime-heading" className="min-w-0">
            <ListenAnytime
              headingId="listen-anytime-heading"
              eyebrow={{ muted: "Podcasts", accent: "& Featured" }}
              title="Listen Anytime"
              description="The newest episodes across every series — long listens, interviews and field reporting, ready whenever you are."
              action={{ label: "Browse the archive", href: "#archive" }}
              items={featured}
            />
          </section>

          <aside className="xl:sticky xl:top-32">
            <NewsletterRail />
          </aside>
        </div>
      </Section>

      <Section id="archive" aria-labelledby="all-episodes-heading" className="bg-surface-2/60">
        <SectionHeading
          id="all-episodes-heading"
          eyebrow="The archive"
          title="All episodes"
          description="Grouped by the show they came from, newest first."
        />
        <div className="mt-8 flex flex-col gap-12">
          {series.map(({ show, episodes }) => (
            <section key={show.id} aria-labelledby={`series-${show.slug}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                <h3
                  id={`series-${show.slug}`}
                  className="font-display text-xl font-bold text-ink"
                >
                  {show.name}
                </h3>
                <p className="text-sm text-muted">
                  {pluralize(episodes.length, "episode")} · {show.tagline}
                </p>
              </div>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {episodes.map((episode) => (
                  <li key={episode.id} className="h-full">
                    <PodcastRow episode={episode} show={show} headingLevel="h4" className="h-full" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}