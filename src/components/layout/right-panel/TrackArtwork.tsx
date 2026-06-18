import type { Track } from "../../../types/track";

interface TrackArtworkProps {
  track: Track;
  size?: number;
  className?: string;
}

export default function TrackArtwork({
  track,
  size = 40,
  className = "",
}: TrackArtworkProps) {
  const initial = track.title.charAt(0).toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-hover ${className}`}
    >
      {track.artworkUrl ? (
        <img
          src={track.artworkUrl}
          alt={track.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold text-tertiary">{initial}</span>
      )}
    </div>
  );
}
