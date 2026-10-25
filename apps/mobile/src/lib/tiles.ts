/**
 * Tile art for the "Up Next" rail.
 *
 * The app runs one station, but the design's rail still wants the tower's tile
 * imagery — the brand waveform tile and the station artwork the Home screen has
 * always used — so the rail cycles through this fixed set rather than repeating
 * a single logo three times.
 *
 * Files live in the repo's public/assets/images, so they are served by both the
 * dev server and the native bundle.
 */
export interface TileArt {
  /** Public path, or null for the brand waveform tile drawn in SVG. */
  src: string | null;
  alt: string;
}

export const upNextTiles: TileArt[] = [
  { src: null, alt: "Prototype FM waveform tile" },
  { src: "/assets/images/pulse-station-urban-radio.jpg", alt: "Urban Radio tile" },
  { src: "/assets/images/pulse-station-highlife.jpg", alt: "Highlife Classics tile" },
  { src: "/assets/images/pulse-event-afrobeats-zone.jpg", alt: "Afrobeats Vibes tile" },
];

export function tileFor(index: number): TileArt {
  return upNextTiles[index % upNextTiles.length];
}
