import { useCallback, useEffect, useState } from "react";
import {
  playlistAddTrack,
  playlistCreate,
  playlistDelete,
  playlistGet,
  playlistList,
  playlistRemoveTrack,
  playlistRename,
} from "../lib/tauri";
import type { Playlist, PlaylistDetail } from "../types/media";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlaylists(await playlistList());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (name: string) => {
      await playlistCreate(name);
      await refresh();
    },
    [refresh],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await playlistRename(id, name);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await playlistDelete(id);
      await refresh();
    },
    [refresh],
  );

  const addTrack = useCallback(async (playlistId: string, trackId: string) => {
    await playlistAddTrack(playlistId, trackId);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { playlists, loading, error, refresh, create, rename, remove, addTrack };
}

export function usePlaylistDetail(id: string | undefined) {
  const [detail, setDetail] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await playlistGet(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const removeTrack = useCallback(
    async (trackId: string) => {
      if (!id) return;
      await playlistRemoveTrack(id, trackId);
      await refresh();
    },
    [id, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { detail, loading, error, refresh, removeTrack };
}
