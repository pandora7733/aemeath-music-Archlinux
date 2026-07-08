import { Link, useParams } from "react-router-dom";
import MediaRow from "../../components/library/MediaRow";
import { usePlaylistDetail } from "../../hooks/usePlaylists";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { detail, loading, error, removeTrack } = usePlaylistDetail(id);

  return (
    <div>
      <Link
        to="/playlists"
        className="mb-4 inline-block text-sm text-secondary transition-colors hover:text-primary"
      >
        ← 모든 플레이리스트
      </Link>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {detail && (
        <>
          <h1 className="text-2xl font-bold text-primary">{detail.name}</h1>
          <p className="mb-6 mt-1 text-sm text-secondary">
            {detail.tracks.length}곡
          </p>

          {detail.tracks.length === 0 ? (
            <p className="py-8 text-center text-sm text-tertiary">
              아직 곡이 없습니다. 곡 목록에서 + 버튼으로 추가하세요.
            </p>
          ) : (
            <ul className="divide-y divide-bg-hover rounded-lg border border-bg-hover">
              {detail.tracks.map((item) => (
                <li key={item.id}>
                  <MediaRow
                    item={item}
                    queue={detail.tracks}
                    trailingAction={
                      <button
                        type="button"
                        aria-label="플레이리스트에서 제거"
                        onClick={(event) => {
                          event.stopPropagation();
                          void removeTrack(item.id);
                        }}
                        className="shrink-0 rounded-full p-1.5 text-xs text-tertiary opacity-0 transition-colors hover:text-accent group-hover:opacity-100"
                      >
                        제거
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
