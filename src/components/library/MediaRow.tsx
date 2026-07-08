import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayer } from "../../hooks/usePlayer";
import { useMediaActions } from "../../context/MediaActionsContext";
import { formatTime } from "../layout/top-player-bar/TimeText";
import type { MediaItem } from "../../types/media";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

interface MediaRowProps {
  item: MediaItem;
  queue: MediaItem[];
  /** Optional extra action rendered at the row end (e.g. remove-from-playlist). */
  trailingAction?: React.ReactNode;
}

export default function MediaRow({ item, queue, trailingAction }: MediaRowProps) {
  const { currentTrack, isPlaying, playFromLibrary } = usePlayer();
  const { favoriteIds, toggleFavorite, playlists, addToPlaylist } =
    useMediaActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addedTo, setAddedTo] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isCurrent = currentTrack?.id === item.id;
  const isFavorite = favoriteIds.has(item.id);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => void playFromLibrary(item, queue)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          void playFromLibrary(item, queue);
        }
      }}
      className={[
        "group flex cursor-pointer items-center gap-3 px-2 py-2 transition-colors",
        isCurrent ? "bg-bg-hover" : "hover:bg-bg-hover",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-elevated text-xs font-semibold uppercase text-tertiary">
        {item.coverPath ? (
          <img
            src={convertFileSrc(item.coverPath)}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          item.extension
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={[
            "truncate text-sm",
            isCurrent ? "font-semibold text-accent" : "font-medium text-primary",
          ].join(" ")}
        >
          {item.title}
          {isCurrent && isPlaying ? " · 재생 중" : ""}
        </p>
        <p className="truncate text-xs text-tertiary">
          {item.artist ?? "알 수 없는 아티스트"}
          {item.album ? ` — ${item.album}` : ""} · {item.extension.toUpperCase()}
        </p>
      </div>

      <button
        type="button"
        aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        onClick={(event) => {
          event.stopPropagation();
          void toggleFavorite(item.id);
        }}
        className={[
          "shrink-0 rounded-full p-1.5 transition-colors",
          isFavorite
            ? "text-accent"
            : "text-tertiary opacity-0 hover:text-accent group-hover:opacity-100",
        ].join(" ")}
      >
        <HeartIcon filled={isFavorite} />
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          aria-label="플레이리스트에 추가"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
            setAddedTo(null);
          }}
          className="rounded-full p-1.5 text-tertiary opacity-0 transition-colors hover:text-primary group-hover:opacity-100"
        >
          <PlusIcon />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-bg-hover bg-bg-elevated py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-semibold text-tertiary">
              플레이리스트에 추가
            </p>
            {playlists.length === 0 && (
              <p className="px-3 py-2 text-xs text-tertiary">
                플레이리스트가 없습니다.
              </p>
            )}
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void addToPlaylist(playlist.id, item.id).then(() =>
                    setAddedTo(playlist.id),
                  );
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary"
              >
                <span className="truncate">{playlist.name}</span>
                {addedTo === playlist.id && (
                  <span className="text-xs text-accent">추가됨</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {trailingAction}

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
