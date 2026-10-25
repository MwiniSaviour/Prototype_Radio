import type { Station } from "@shared/lib/types";

/**
 * The dial's artwork, used as the tile art wherever programmes are listed.
 *
 * The prototype keeps station identity in the photography: the flagship's black
 * waveform tile, Urban Radio, Highlife Classics and Afrobeats Vibes. Programme
 * tiles and schedule rows take those images in dial order, so a list shows the
 * stations at a glance and never invents a fifth image.
 */
export function stationArtwork(stations: Station[], index: number): Station | undefined {
  if (stations.length === 0) return undefined;
  return stations[index % stations.length];
}
