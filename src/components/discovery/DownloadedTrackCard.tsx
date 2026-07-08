import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayer } from "../../hooks/usePlayer";
import { formatTime } from "../layout/top-player-bar/TimeText";
import type { MediaItem } from "../../types/media";

function PlayIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

interface DownloadedTrackCardProps {
  track: MediaItem;
  queue: MediaItem[];
}

export default function DownloadedTrackCard({
  track,
  queue,
}: DownloadedTrackCardProps) {
  const { playFromLibrary, currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <div className="group rounded-lg p-2 transition-colors hover:bg-bg-hover">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-bg-elevated">
        {track.coverPath ? (
          <img
            src={convertFileSrc(track.coverPath)}
            alt={track.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-tertiary">
            {track.title.charAt(0)}
          </div>
        )}

        <button
          type="button"
          aria-label="재생"
          onClick={() => void playFromLibrary(track, queue)}
          className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          <PlayIcon />
        </button>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-primary">
        {track.title}
        {isCurrent && isPlaying ? " · 재생 중" : ""}
      </p>
      <p className="truncate text-xs text-tertiary">
        {track.artist ?? "알 수 없는 아티스트"}
      </p>
      <p className="truncate text-xs text-tertiary">
        {track.durationSecs != null
          ? formatTime(track.durationSecs)
          : track.extension.toUpperCase()}
      </p>
    </div>
  );
}
