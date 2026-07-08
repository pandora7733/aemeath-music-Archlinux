import { useCallback, useEffect, useState } from "react";
import MediaList from "../../components/library/MediaList";
import { getRecentlyAdded, onLibraryUpdated } from "../../lib/tauri";
import type { MediaItem } from "../../types/media";

export default function RecentlyAddedPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getRecentlyAdded(100));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    let unlisten: (() => void) | undefined;
    void onLibraryUpdated(() => void refresh()).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, [refresh]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-primary">최근 추가된 항목</h1>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
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
