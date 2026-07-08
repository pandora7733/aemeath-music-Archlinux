import { useCallback, useEffect, useState } from "react";
import { favoriteIds, favoriteList, favoriteToggle } from "../lib/tauri";
import type { MediaItem } from "../types/media";

/** Loads the favorite track-id set and exposes a toggle. */
export function useFavoriteIds() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const list = await favoriteIds();
      setIds(new Set(list));
    } catch {
      setIds(new Set());
    }
  }, []);

  const toggle = useCallback(async (trackId: string) => {
    try {
      const nowFavorite = await favoriteToggle(trackId);
      setIds((prev) => {
        const next = new Set(prev);
        if (nowFavorite) {
          next.add(trackId);
        } else {
          next.delete(trackId);
        }
        return next;
      });
    } catch {
      // keep previous state on failure
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ids, toggle, refresh };
}

/** Loads full favorite tracks, most recently favorited first. */
export function useFavoriteTracks() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await favoriteList());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
