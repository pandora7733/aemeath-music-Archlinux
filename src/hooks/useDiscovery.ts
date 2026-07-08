import { useCallback, useEffect, useState } from "react";
import {
  discoveryCharts,
  discoveryReleases,
  discoverySearch,
} from "../lib/tauri";
import { normalizeDiscoveryError } from "../lib/networkError";
import type { DiscoveryTrack } from "../types/media";

type DiscoveryMode = "charts" | "releases";
const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000;

interface DiscoveryCacheEntry {
  tracks: DiscoveryTrack[];
  fetchedAt: number;
}

const discoveryCache: Partial<Record<DiscoveryMode, DiscoveryCacheEntry>> = {};
const inFlightRequests: Partial<Record<DiscoveryMode, Promise<DiscoveryTrack[]>>> = {};

function isFresh(entry?: DiscoveryCacheEntry): boolean {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < DISCOVERY_CACHE_TTL_MS;
}

async function fetchDiscovery(
  mode: DiscoveryMode,
  options?: { force?: boolean },
): Promise<DiscoveryTrack[]> {
  const force = options?.force ?? false;
  const cached = discoveryCache[mode];
  if (!force && cached && isFresh(cached)) {
    return cached.tracks;
  }

  if (!force && inFlightRequests[mode]) {
    return inFlightRequests[mode]!;
  }

  const req =
    mode === "charts" ? discoveryCharts() : discoveryReleases();

  inFlightRequests[mode] = req
    .then((tracks) => {
      discoveryCache[mode] = { tracks, fetchedAt: Date.now() };
      return tracks;
    })
    .finally(() => {
      delete inFlightRequests[mode];
    });

  return inFlightRequests[mode]!;
}

export function primeDiscoveryCache() {
  void fetchDiscovery("charts").catch(() => {});
  void fetchDiscovery("releases").catch(() => {});
}

/** Fetches online chart/new-release tracks from the free Deezer API. */
export function useDiscovery(mode: DiscoveryMode) {
  const [tracks, setTracks] = useState<DiscoveryTrack[]>(
    discoveryCache[mode]?.tracks ?? [],
  );
  const [loading, setLoading] = useState(discoveryCache[mode] == null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await fetchDiscovery(mode, { force: options?.force ?? true });
      setTracks(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(normalizeDiscoveryError(message));
      setTracks([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [mode]);

  useEffect(() => {
    const cached = discoveryCache[mode];
    if (cached) {
      setTracks(cached.tracks);
      setLoading(false);
      // 캐시가 있어도 오래된 데이터일 수 있으므로 조용히 갱신
      void refresh({ force: !isFresh(cached), silent: true });
      return;
    }
    void refresh({ force: false, silent: false });
  }, [refresh]);

  return { tracks, loading, error, refresh };
}

/** Searches online tracks (Deezer with iTunes fallback). */
export function useDiscoverySearch(query: string) {
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setTracks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      discoverySearch(trimmed)
        .then((result) => {
          if (!cancelled) setTracks(result);
        })
        .catch((err) => {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : String(err);
            setError(normalizeDiscoveryError(message));
            setTracks([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { tracks, loading, error };
}
