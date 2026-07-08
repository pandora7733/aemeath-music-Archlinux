import type { DiscoveryTrack } from "../../types/media";
import type { DownloadState } from "../../hooks/useDownloads";

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

function DownloadIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

interface DiscoveryCardProps {
  track: DiscoveryTrack;
  downloadState?: DownloadState;
  onPreview: (track: DiscoveryTrack) => void;
  onDownload: (track: DiscoveryTrack) => void;
  onCancelDownload: (track: DiscoveryTrack) => void;
}

export default function DiscoveryCard({
  track,
  downloadState,
  onPreview,
  onDownload,
  onCancelDownload,
}: DiscoveryCardProps) {
  const downloadLabel =
    downloadState === "downloading"
      ? "취소"
      : downloadState === "done"
        ? "다운로드 완료"
        : downloadState === "error"
          ? "다시 시도"
          : "다운로드";

  return (
    <div className="group rounded-lg p-2 transition-colors hover:bg-bg-hover">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-bg-elevated">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-tertiary">
            {track.title.charAt(0)}
          </div>
        )}

        {track.previewUrl && (
          <button
            type="button"
            aria-label="30초 미리듣기"
            onClick={() => onPreview(track)}
            className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            <PlayIcon />
          </button>
        )}
      </div>

      <p className="mt-2 truncate text-sm font-medium text-primary">
        {track.title}
      </p>
      <p className="truncate text-xs text-tertiary">{track.artist}</p>

      <button
        type="button"
        onClick={() =>
          downloadState === "downloading"
            ? onCancelDownload(track)
            : onDownload(track)
        }
        disabled={downloadState === "done"}
        className={[
          "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
          downloadState === "done"
            ? "bg-bg-elevated text-tertiary"
            : "bg-bg-elevated text-secondary hover:bg-accent hover:text-white",
          downloadState === "downloading" ? "text-accent" : "",
        ].join(" ")}
      >
        <DownloadIcon />
        {downloadLabel}
      </button>
    </div>
  );
}
