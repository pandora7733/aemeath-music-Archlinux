import { useMemo, useState } from "react";
import MediaList from "../../components/library/MediaList";
import { useLibrary } from "../../hooks/useLibrary";

export default function SongsPage() {
  const { items, loading, error, scannedRoot, refresh } = useLibrary({
    kind: "audio",
    sort: "title",
  });
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;

    return items.filter((item) => {
      const artist = (item.artist ?? "").toLowerCase();
      const album = (item.album ?? "").toLowerCase();
      const title = item.title.toLowerCase();
      return (
        title.includes(trimmed) ||
        artist.includes(trimmed) ||
        album.includes(trimmed)
      );
    });
  }, [items, query]);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">노래</h1>
          {scannedRoot && (
            <p className="mt-1 text-xs text-tertiary">스캔 경로: {scannedRoot}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="노래 검색 (제목/아티스트/앨범)"
            className="w-72 rounded-md border border-bg-hover bg-bg-elevated px-3 py-1.5 text-sm text-primary placeholder:text-tertiary outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary disabled:opacity-50"
          >
            {loading ? "스캔 중..." : "다시 스캔"}
          </button>
        </div>
      </div>

      {!loading && !error && query.trim() && (
        <p className="mb-3 text-xs text-tertiary">
          검색 결과: {filteredItems.length}곡 / 전체 {items.length}곡
        </p>
      )}

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">
          음원을 불러오는 중...
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {!loading && !error && <MediaList items={filteredItems} />}
    </div>
  );
}
