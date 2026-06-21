import MediaList from "../../components/library/MediaList";
import { useLibrary } from "../../hooks/useLibrary";

export default function SongsPage() {
  const { items, loading, error, scannedRoot, refresh } = useLibrary({
    kind: "audio",
    sort: "title",
  });

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">노래</h1>
          {scannedRoot && (
            <p className="mt-1 text-xs text-tertiary">스캔 경로: {scannedRoot}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary disabled:opacity-50"
        >
          {loading ? "스캔 중..." : "다시 스캔"}
        </button>
      </div>

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

      {!loading && !error && <MediaList items={items} />}
    </div>
  );
}
