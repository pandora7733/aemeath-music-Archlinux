import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { mediaItemToTrack, mediaItemsToTracks } from "../lib/mediaMapper";
import {
  playerPlay,
  playerSeek,
  playerSetVolume,
  playerTogglePause,
  type PlaybackState,
} from "../lib/tauri";
import type { MediaItem } from "../types/media";
import type { Track } from "../types/track";

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  volume: number;
  playFromLibrary: (item: MediaItem, allItems: MediaItem[]) => Promise<void>;
  play: (track: Track) => Promise<void>;
  togglePlay: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (time: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const REWIND_THRESHOLD_SEC = 3;

function applyPlaybackState(
  state: PlaybackState,
  setters: {
    setIsPlaying: (v: boolean) => void;
    setCurrentTime: (v: number) => void;
    setDuration: (v: number) => void;
    setVolumeState: (v: number) => void;
  },
) {
  setters.setIsPlaying(state.isPlaying);
  setters.setCurrentTime(state.positionSecs);
  if (state.durationSecs > 0) {
    setters.setDuration(state.durationSecs);
  }
  setters.setVolumeState(state.volume);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const queueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const repeatModeRef = useRef<RepeatMode>("off");
  const isShuffleRef = useRef(false);

  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  queueRef.current = queue;
  currentTrackRef.current = currentTrack;
  repeatModeRef.current = repeatMode;
  isShuffleRef.current = isShuffle;

  const syncFromState = useCallback((state: PlaybackState) => {
    applyPlaybackState(state, {
      setIsPlaying,
      setCurrentTime,
      setDuration,
      setVolumeState,
    });
  }, []);

  const loadAndPlay = useCallback(
    async (track: Track) => {
      setCurrentTrack(track);
      setCurrentTime(0);
      try {
        const state = await playerPlay(track.path);
        syncFromState(state);
        if (state.durationSecs > 0) {
          setDuration(state.durationSecs);
        }
      } catch {
        setIsPlaying(false);
      }
    },
    [syncFromState],
  );

  const play = useCallback(
    async (track: Track) => {
      await loadAndPlay(track);
    },
    [loadAndPlay],
  );

  const playFromLibrary = useCallback(
    async (item: MediaItem, allItems: MediaItem[]) => {
      const tracks = mediaItemsToTracks(allItems);
      setQueue(tracks);
      await loadAndPlay(mediaItemToTrack(item));
    },
    [loadAndPlay],
  );

  const getCurrentIndex = useCallback(() => {
    const track = currentTrackRef.current;
    const q = queueRef.current;
    if (!track || q.length === 0) return -1;
    return q.findIndex((t) => t.id === track.id);
  }, []);

  const playTrackAtIndex = useCallback(
    async (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.length) return;
      await loadAndPlay(q[index]);
    },
    [loadAndPlay],
  );

  const pickShuffleIndex = useCallback((currentIndex: number, length: number) => {
    if (length <= 1) return 0;
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * length);
    }
    return nextIndex;
  }, []);

  const handleTrackEnded = useCallback(async () => {
    const mode = repeatModeRef.current;
    const q = queueRef.current;
    const currentIndex = getCurrentIndex();

    if (mode === "one" && currentTrackRef.current) {
      await loadAndPlay(currentTrackRef.current);
      return;
    }

    if (isShuffleRef.current && q.length > 0) {
      const base = currentIndex === -1 ? 0 : currentIndex;
      await playTrackAtIndex(pickShuffleIndex(base, q.length));
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < q.length) {
      await playTrackAtIndex(nextIndex);
      return;
    }

    if (mode === "all" && q.length > 0) {
      await playTrackAtIndex(0);
      return;
    }

    setIsPlaying(false);
    setCurrentTime(0);
  }, [getCurrentIndex, loadAndPlay, pickShuffleIndex, playTrackAtIndex]);

  const next = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    const mode = repeatModeRef.current;
    const currentIndex = getCurrentIndex();

    if (mode === "one" && currentTrackRef.current) {
      await loadAndPlay(currentTrackRef.current);
      return;
    }

    if (isShuffleRef.current) {
      const base = currentIndex === -1 ? 0 : currentIndex;
      await playTrackAtIndex(pickShuffleIndex(base, q.length));
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < q.length) {
      await playTrackAtIndex(nextIndex);
      return;
    }

    if (mode === "all") {
      await playTrackAtIndex(0);
      return;
    }

    setIsPlaying(false);
  }, [getCurrentIndex, loadAndPlay, pickShuffleIndex, playTrackAtIndex]);

  const prev = useCallback(async () => {
    if (currentTime > REWIND_THRESHOLD_SEC) {
      const state = await playerSeek(0);
      syncFromState(state);
      return;
    }

    const q = queueRef.current;
    if (q.length === 0) return;

    const currentIndex = getCurrentIndex();
    if (currentIndex <= 0) {
      const state = await playerSeek(0);
      syncFromState(state);
      return;
    }

    if (isShuffleRef.current) {
      const base = currentIndex === -1 ? 0 : currentIndex;
      await playTrackAtIndex(pickShuffleIndex(base, q.length));
      return;
    }

    await playTrackAtIndex(currentIndex - 1);
  }, [
    currentTime,
    getCurrentIndex,
    pickShuffleIndex,
    playTrackAtIndex,
    syncFromState,
  ]);

  const togglePlay = useCallback(async () => {
    if (!currentTrackRef.current) return;
    try {
      const state = await playerTogglePause();
      syncFromState(state);
    } catch {
      setIsPlaying(false);
    }
  }, [syncFromState]);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off",
    );
  }, []);

  const seek = useCallback(
    async (time: number) => {
      try {
        const state = await playerSeek(time);
        syncFromState(state);
      } catch {
        setCurrentTime(time);
      }
    },
    [syncFromState],
  );

  const setVolume = useCallback(
    async (v: number) => {
      const clamped = Math.min(1, Math.max(0, v));
      setVolumeState(clamped);
      try {
        const state = await playerSetVolume(clamped);
        syncFromState(state);
      } catch {
        // keep local volume state
      }
    },
    [syncFromState],
  );

  useEffect(() => {
    let unlistenTick: (() => void) | undefined;
    let unlistenEnded: (() => void) | undefined;

    void (async () => {
      unlistenTick = await listen<PlaybackState>("player-tick", (event) => {
        syncFromState(event.payload);
      });
      unlistenEnded = await listen<PlaybackState>("player-ended", () => {
        void handleTrackEnded();
      });
    })();

    return () => {
      unlistenTick?.();
      unlistenEnded?.();
    };
  }, [handleTrackEnded, syncFromState]);

  const value = useMemo(
    () => ({
      currentTrack,
      queue,
      isPlaying,
      isShuffle,
      repeatMode,
      currentTime,
      duration,
      volume,
      playFromLibrary,
      play,
      togglePlay,
      toggleShuffle,
      cycleRepeat,
      next,
      prev,
      seek,
      setVolume,
    }),
    [
      currentTrack,
      queue,
      isPlaying,
      isShuffle,
      repeatMode,
      currentTime,
      duration,
      volume,
      playFromLibrary,
      play,
      togglePlay,
      toggleShuffle,
      cycleRepeat,
      next,
      prev,
      seek,
      setVolume,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}
