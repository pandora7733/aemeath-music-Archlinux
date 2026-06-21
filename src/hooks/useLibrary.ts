import { useCallback, useEffect, useState } from "react";
import { getLibraryItems, scanLibrary } from "../lib/tauri";
import type { GetLibraryItemsParams, MediaItem } from "../types/media";

export function useLibrary(params?: GetLibraryItemsParams) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedRoot, setScannedRoot] = useState<string | null>(null);

  const kind = params?.kind;
  const sort = params?.sort;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const scanResult = await scanLibrary();
      setScannedRoot(scanResult.root);
      const libraryItems = await getLibraryItems({ kind, sort });
      setItems(libraryItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind, sort]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, scannedRoot, refresh };
}
