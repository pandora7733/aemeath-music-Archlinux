import { useCallback, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import MediaList from "../../components/library/MediaList";
import { getAlbums, getAlbumTracks } from "../../lib/tauri";
import type { AlbumGroup, MediaItem } from "../../types/media";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AlbumGroup | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }, []);

  const openAlbum = useCallback(async (album: AlbumGroup) => {
    setSelected(album);
    setTracksLoading(true);
    try {
      setTracks(await getAlbumTracks(album.artist, album.album));
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  }, []);

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 text-sm text-secondary transition-colors hover:text-primary"
        >
          ← 앨범 목록으로
        </button>
        <div className="mb-6 flex items-end gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-elevated">
            {selected.coverPath ? (
              <img
                src={convertFileSrc(selected.coverPath)}
                alt={selected.album}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-tertiary">
                {selected.album.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{selected.album}</h1>
            <p className="mt-1 text-sm text-secondary">
              {selected.artist || "알 수 없는 아티스트"} · {selected.trackCount}곡
            </p>
          </div>
        </div>

        {tracksLoading ? (
          <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
        ) : (
          <MediaList items={tracks} />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-primary">앨범</h1>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {!loading && !error && albums.length === 0 && (
        <p className="py-8 text-center text-sm text-tertiary">
          앨범 태그가 있는 곡이 없습니다. 라이브러리를 스캔해 보세요.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
        {albums.map((album) => (
          <button
            key={`${album.artist}::${album.album}`}
            type="button"
            onClick={() => void openAlbum(album)}
            className="group text-left"
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-bg-elevated transition-transform group-hover:scale-[1.02]">
              {album.coverPath ? (
                <img
                  src={convertFileSrc(album.coverPath)}
                  alt={album.album}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl font-bold text-tertiary">
                  {album.album.charAt(0)}
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-primary">
              {album.album}
            </p>
            <p className="truncate text-xs text-tertiary">
              {album.artist || "알 수 없는 아티스트"} · {album.trackCount}곡
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
