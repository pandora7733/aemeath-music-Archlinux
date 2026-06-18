import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  play: (track: Track) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

// Phase 1용 mock 데이터
const MOCK_TRACKS: Track[] = [
  { id: "1", title: "Sample Song", artist: "Sample Artist", duration: 210 },
  { id: "2", title: "Second Track", artist: "Another Artist", duration: 184 },
  { id: "3", title: "Third Tune", artist: "Some Band", duration: 247 },
];

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  const duration = currentTrack?.duration ?? 0;

  const play = useCallback((track: Track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off",
    );
  }, []);

  const goToOffset = useCallback(
    (offset: number) => {
      setCurrentTrack((track) => {
        if (queue.length === 0) return track;
        const index = track ? queue.findIndex((t) => t.id === track.id) : -1;
        const base = index === -1 ? 0 : index;
        const nextIndex = (base + offset + queue.length) % queue.length;
        return queue[nextIndex];
      });
      setCurrentTime(0);
    },
    [queue],
  );

  const next = useCallback(() => goToOffset(1), [goToOffset]);
  const prev = useCallback(() => goToOffset(-1), [goToOffset]);

  const seek = useCallback(
    (time: number) => {
      setCurrentTime(Math.min(duration, Math.max(0, time)));
    },
    [duration],
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
  }, []);

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
