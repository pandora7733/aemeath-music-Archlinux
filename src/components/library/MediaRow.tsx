import { formatTime } from "../layout/top-player-bar/TimeText";
import type { MediaItem } from "../../types/media";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaRow({ item }: { item: MediaItem }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-bg-hover">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bg-elevated text-xs font-semibold uppercase text-tertiary">
        {item.extension}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{item.title}</p>
        <p className="truncate text-xs text-tertiary">
          {item.artist ?? "알 수 없는 아티스트"} · {item.extension.toUpperCase()}
        </p>
      </div>

      <div className="shrink-0 text-right text-xs tabular-nums text-tertiary">
        {item.durationSecs != null ? (
          <p>{formatTime(item.durationSecs)}</p>
        ) : (
          <p>{formatFileSize(item.fileSize)}</p>
        )}
      </div>
    </div>
  );
}
