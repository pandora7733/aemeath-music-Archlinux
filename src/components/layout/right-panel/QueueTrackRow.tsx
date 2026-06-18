import { usePlayer } from "../../../hooks/usePlayer";
import { formatTime } from "../top-player-bar/TimeText";
import type { Track } from "../../../types/track";
import TrackArtwork from "./TrackArtwork";

interface QueueTrackRowProps {
  track: Track;
  isCurrent?: boolean;
}

export default function QueueTrackRow({
  track,
  isCurrent = false,
}: QueueTrackRowProps) {
  const { play, isPlaying } = usePlayer();

  return (
    <button
      type="button"
      onClick={() => play(track)}
      className={[
        "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
        isCurrent ? "bg-bg-hover" : "hover:bg-bg-hover",
      ].join(" ")}
    >
      <TrackArtwork track={track} size={40} />

      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate text-sm",
            isCurrent ? "font-semibold text-accent" : "text-primary",
          ].join(" ")}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-tertiary">{track.artist}</p>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-tertiary">
        {isCurrent && isPlaying ? "재생 중" : formatTime(track.duration)}
      </span>
    </button>
  );
}
