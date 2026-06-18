import type { Track } from "../../../types/track";
import TrackArtwork from "./TrackArtwork";

export default function NowPlayingMini({ track }: { track: Track }) {
  return (
    <div className="flex items-center gap-3 border-b border-bg-hover px-4 py-3">
      <TrackArtwork track={track} size={48} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-primary">
          {track.title}
        </p>
        <p className="truncate text-xs text-tertiary">{track.artist}</p>
      </div>
    </div>
  );
}
