import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  favoriteIds as fetchFavoriteIds,
  favoriteToggle,
  playlistAddTrack,
  playlistList,
} from "../lib/tauri";
import type { Playlist } from "../types/media";

interface MediaActionsValue {
  favoriteIds: Set<string>;
  toggleFavorite: (trackId: string) => Promise<void>;
  playlists: Playlist[];
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const MediaActionsContext = createContext<MediaActionsValue | null>(null);

export function MediaActionsProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const refreshFavorites = useCallback(async () => {
    try {
      setFavoriteIds(new Set(await fetchFavoriteIds()));
    } catch {
      setFavoriteIds(new Set());
    }
  }, []);

  const refreshPlaylists = useCallback(async () => {
    try {
      setPlaylists(await playlistList());
    } catch {
      setPlaylists([]);
    }
  }, []);

  const toggleFavorite = useCallback(async (trackId: string) => {
    try {
      const nowFavorite = await favoriteToggle(trackId);
      setFavoriteIds((prev) => {
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

  const addToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      await playlistAddTrack(playlistId, trackId);
      await refreshPlaylists();
    },
    [refreshPlaylists],
  );

  useEffect(() => {
    void refreshFavorites();
    void refreshPlaylists();
  }, [refreshFavorites, refreshPlaylists]);

  const value = useMemo(
    () => ({
      favoriteIds,
      toggleFavorite,
      playlists,
      addToPlaylist,
      refreshPlaylists,
      refreshFavorites,
    }),
    [
      favoriteIds,
      toggleFavorite,
      playlists,
      addToPlaylist,
      refreshPlaylists,
      refreshFavorites,
    ],
  );

  return (
    <MediaActionsContext.Provider value={value}>
      {children}
    </MediaActionsContext.Provider>
  );
}

export function useMediaActions() {
  const ctx = useContext(MediaActionsContext);
  if (!ctx) {
    throw new Error("useMediaActions must be used within MediaActionsProvider");
  }
  return ctx;
}
