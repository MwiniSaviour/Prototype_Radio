"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Show } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatClock, formatDayRange } from "@/lib/format";
import { siteConfig } from "@/lib/constants";
import { IconClock, IconPause, IconPlay, IconVolume, IconWaveform } from "@/components/ui/icons";
import { NowPlayingChip } from "./NowPlayingChip";
import { Waveform } from "./Waveform";

export interface LivePlayerHeroProps {
  show: Show;
  /** The slot the hero is representing: the current one when live, the next one when off air. */
  slot: { start: string; end: string } | null;
  isLive: boolean;
  className?: string;
}

/*
 * The stream URL is opt-in via env because embedding a broadcaster's feed on a
 * new domain has unresolved licensing/CDN-permission questions (see
 * docs/live-audio-backend-research.md §8–9). The player UI must work without it.
 */
const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL ?? "";

export function LivePlayerHero({ show, slot, isLive, className }: LivePlayerHeroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [message, setMessage] = useState("");

  const configured = STREAM_URL.length > 0;
  const days = formatDayRange(show.schedule.map((entry) => entry.day));
  const hostLine = show.hosts.map((host) => host.name).join(" & ") || siteConfig.name;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function togglePlayback() {
    if (!configured) {
      // No engine to drive, but the control must still reflect the user's intent
      // and tell them why nothing is audible.
      setPlaying((current) => !current);
      setMessage(
        "Live stream is not configured. Set NEXT_PUBLIC_STREAM_URL to enable playback.",
      );
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setMessage("");
      void audio.play().catch(() => {
        setPlaying(false);
        setMessage("The live stream could not be started. Please try again.");
      });
    } else {
      audio.pause();
    }
  }

  return (
    <section
      id="live-player"
      aria-labelledby="live-player-heading"
      className={cn(
        "relative isolate overflow-hidden rounded-[4px] bg-panel text-white",
        className,
      )}
    >
      <Image
        src={show.image.src}
        alt={show.image.alt}
        fill
        sizes="(max-width: 1023px) 100vw, 860px"
        className="object-cover object-center opacity-90"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-black/15"
      />

      <div className="relative flex min-h-[19rem] flex-col justify-between gap-7 p-5 sm:min-h-[21rem] sm:p-7 lg:min-h-[22.5rem]">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-[3px] border border-brand/70 px-2.5 py-1.5 text-[0.625rem] font-bold tracking-[0.16em] text-white uppercase">
            <IconWaveform className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            {isLive ? "Live on air" : "Up next"}
          </p>
          <h1
            id="live-player-heading"
            className="mt-4 font-display text-[34px] leading-[1.05] font-bold tracking-[-0.015em] text-white sm:mt-5 sm:text-[44px] lg:text-[50px]"
          >
            {show.name}
          </h1>
          <p className="mt-3 max-w-[30rem] text-[13.5px] leading-[1.55] text-white/80 sm:text-[14.5px]">
            {show.tagline}
          </p>
          {slot ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/75 sm:text-sm">
              <IconClock className="h-3.5 w-3.5 shrink-0 text-white/70" aria-hidden="true" />
              <span className="font-medium tabular-nums">
                {formatClock(slot.start)} – {formatClock(slot.end)}
              </span>
              <span aria-hidden="true" className="text-white/40">
                |
              </span>
              <span>{days}</span>
            </p>
          ) : null}
        </div>

        <div>
          {/* The lg+ right padding reserves the corner the Now Playing chip
              absolutely positions into, so the waveform never runs under it. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-4 sm:gap-x-5 lg:pr-[20rem]">
            <button
              type="button"
              aria-pressed={playing}
              aria-label={playing ? `Pause ${show.name} live stream` : `Play ${show.name} live stream`}
              onClick={togglePlayback}
              className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-brand text-white transition-[background-color,transform] duration-200 hover:bg-brand-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none motion-reduce:active:scale-100"
            >
              {playing ? (
                <IconPause className="h-6 w-6" aria-hidden="true" />
              ) : (
                <IconPlay className="h-6 w-6 translate-x-px" aria-hidden="true" />
              )}
            </button>

            <Waveform playing={playing} className="h-7 max-w-[18rem] flex-1" />

            <span className="ml-auto flex items-center gap-2.5">
              <IconVolume className="h-5 w-5 shrink-0 text-white/75" aria-hidden="true" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label="Stream volume"
                onChange={(event) => setVolume(Number(event.target.value))}
                className="hidden h-1.5 w-24 cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
              />
            </span>
          </div>

          <p role="status" className="mt-3 min-h-[1.125rem] text-xs leading-relaxed text-white/75">
            {message}
          </p>
        </div>

        <NowPlayingChip
          label={isLive ? "Now playing" : "Next up"}
          title={show.name}
          artist={hostLine}
          image={show.image}
          className="mt-1 w-full sm:mt-0 sm:w-fit sm:self-end lg:absolute lg:right-7 lg:bottom-7"
        />
      </div>

      <audio
        ref={audioRef}
        src={STREAM_URL || undefined}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setMessage("");
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setMessage("The live stream could not be reached. Please try again.");
        }}
      />
    </section>
  );
}
