import type { MediaItem } from "../types/media";
import type { Track } from "../types/track";

export function mediaItemToTrack(item: MediaItem): Track {
  return {
    id: item.id,
    path: item.path,
    title: item.title,
    artist: item.artist ?? "알 수 없는 아티스트",
    album: item.album ?? undefined,
    duration: item.durationSecs ?? 0,
  };
}

export function mediaItemsToTracks(items: MediaItem[]): Track[] {
  return items.map(mediaItemToTrack);
}
