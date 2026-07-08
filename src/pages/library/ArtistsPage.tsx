import { useCallback, useEffect, useState } from "react";
import MediaList from "../../components/library/MediaList";
import { getArtists, getArtistTracks } from "../../lib/tauri";
import type { ArtistGroup, MediaItem } from "../../types/media";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ArtistGroup | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  useEffect(() => {
    getArtists()
      .then(setArtists)
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }, []);

  const openArtist = useCallback(async (artist: ArtistGroup) => {
    setSelected(artist);
    setTracksLoading(true);
    try {
      setTracks(await getArtistTracks(artist.artist));
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
          ← 아티스트 목록으로
        </button>
        <h1 className="text-2xl font-bold text-primary">{selected.artist}</h1>
        <p className="mb-6 mt-1 text-sm text-secondary">
          앨범 {selected.albumCount}개 · {selected.trackCount}곡
        </p>

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
      <h1 className="mb-4 text-2xl font-bold text-primary">아티스트</h1>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {!loading && !error && artists.length === 0 && (
        <p className="py-8 text-center text-sm text-tertiary">
          아티스트 태그가 있는 곡이 없습니다. 라이브러리를 스캔해 보세요.
        </p>
      )}

      <ul className="divide-y divide-bg-hover rounded-lg border border-bg-hover">
        {artists.map((artist) => (
          <li key={artist.artist}>
            <button
              type="button"
              onClick={() => void openArtist(artist)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-bg-hover"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-sm font-semibold text-tertiary">
                {artist.artist.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">
                  {artist.artist}
                </p>
                <p className="text-xs text-tertiary">
                  앨범 {artist.albumCount}개 · {artist.trackCount}곡
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
