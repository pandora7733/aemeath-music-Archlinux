import { useEffect } from "react";
import MediaList from "../../components/library/MediaList";
import { useMediaActions } from "../../context/MediaActionsContext";
import { useFavoriteTracks } from "../../hooks/useFavorites";

export default function FavoritesPage() {
  const { items, loading, error, refresh } = useFavoriteTracks();
  const { favoriteIds } = useMediaActions();

  // Re-fetch when the favorite set changes (heart toggled anywhere).
  useEffect(() => {
    void refresh();
  }, [favoriteIds, refresh]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-primary">즐겨찾는 노래</h1>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-8 text-center text-sm text-tertiary">
          아직 즐겨찾기한 노래가 없습니다. 곡 목록에서 하트를 눌러 추가하세요.
        </p>
      )}

      {!loading && !error && items.length > 0 && <MediaList items={items} />}
    </div>
  );
}
