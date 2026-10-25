import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { PulseLogo } from "~/components/ui/PulseLogo";
import { SectionHeading } from "~/components/ui/primitives";
import { LiveHeroCard } from "~/components/radio/LiveHeroCard";
import { StationCard } from "~/components/radio/StationCard";
import { TrendingShowRow } from "~/components/radio/TrendingShowRow";
import { FeaturedEventCard } from "~/components/events/FeaturedEventCard";
import { useContent } from "~/content/ContentProvider";
import { usePlayer } from "~/content/PlayerProvider";
import { mediaUrl } from "~/lib/api";

import { shows as showFixtures } from "@shared/data/shows";

/**
 * Home: brand header, the flagship live player, the Live Radio rail, the next
 * ticketed event and a "Trending Now" show row — the order and spacing of the
 * design's second screen.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const { stations, events, listener } = useContent();
  const { play, isPlaying, station: activeStation } = usePlayer();

  const flagship = stations.find((station) => station.flagship) ?? stations[0];
  // Featured first, then the soonest — the design's hero event is the featured one.
  const nextEvent = events.find((event) => event.featured) ?? events[0];
  // The mock's trending row is the Afrobeats strand; fall back to the first
  // entertainment programme if that show is ever removed from the shared seed.
  const trending = [
    showFixtures.find((show) => show.slug === "afrobeats-takeover") ??
      showFixtures.find((show) => show.category?.slug === "entertainment"),
  ].filter((show): show is NonNullable<typeof show> => Boolean(show));

  return (
    <div className="pb-4">
      {/* The design has no visible page title; screen readers still need one h1. */}
      <h1 className="sr-only">Pulse Radio — Home</h1>
      <header className="flex items-center justify-between px-5 pt-1.5 pb-3.5">
        <PulseLogo />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/search")}
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-full text-[#1d2532] transition active:scale-95"
          >
            <Icon name="search" size={21} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Your profile"
            className="h-[34px] w-[34px] overflow-hidden rounded-full ring-[1.5px] ring-white/70 transition active:scale-95"
          >
            <img
              src={mediaUrl(listener.avatarUrl)}
              alt={`${listener.name}'s profile photo`}
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </header>

      <LiveHeroCard station={flagship} />

      <section className="mt-5">
        <SectionHeading
          title="Live Radio"
          action="See All"
          onAction={() => navigate("/live")}
          className="px-5"
        />
        <div className="rail mt-2.5 gap-2.5 bg-paper px-5 pb-1 [scroll-padding-inline:1.25rem]">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onSelect={() => {
                play(station);
                navigate("/live");
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeading
          title="Upcoming Events"
          action="See All"
          onAction={() => navigate("/explore")}
          className="px-5"
        />
        <div className="mt-2.5 px-5">
          {nextEvent ? (
            <FeaturedEventCard
              event={nextEvent}
              variant="wide"
              onSelect={() => navigate(`/events/${nextEvent.slug}`)}
            />
          ) : null}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeading
          title="Trending Now"
          action="See All"
          onAction={() => navigate("/explore")}
          className="px-5"
        />
        <ul className="mt-2.5 space-y-2 px-5">
          {trending.map((show) => (
            <li key={show.id}>
              <TrendingShowRow
                show={show}
                playing={isPlaying && activeStation.id === flagship.id}
                onPlay={() => play(flagship)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
