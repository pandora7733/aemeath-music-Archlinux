import DiscoveryGrid from "../components/discovery/DiscoveryGrid";
import { useDiscovery } from "../hooks/useDiscovery";

export default function NewPage() {
  const { tracks, loading, error, refresh } = useDiscovery("releases");

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">신규</h1>
          <p className="mt-1 text-xs text-tertiary">
            새로 나온 음악 (Deezer · 30초 미리듣기)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">
          신곡을 불러오는 중...
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          신곡 목록을 불러올 수 없습니다: {error}
        </div>
      )}

      {!loading && !error && <DiscoveryGrid tracks={tracks} />}
    </div>
  );
}
