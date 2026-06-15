import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { Track } from "../types/track";
  
interface PlayerContextValue {
    currentTrack: Track | null;
    queue: Track[];
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    play: (track: Track) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
}
  
const PlayerContext = createContext<PlayerContextValue | null>(null);
  
// Phase 1용 mock 데이터
const MOCK_TRACK: Track = {
    id: "1",
    title: "Sample Song",
    artist: "Sample Artist",
    duration: 210,
};
  
export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACK);
    const [queue, setQueue] = useState<Track[]>([MOCK_TRACK]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(0.8);
  
    const play = useCallback((track: Track) => {
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
      setQueue((prev) => (prev.some((t) => t.id === track.id) ? prev : [...prev, track]));
    }, []);
  
    const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  
    const setVolume = useCallback((v: number) => {
      setVolumeState(Math.min(1, Math.max(0, v)));
    }, []);
  
    const value = useMemo(
      () => ({
        currentTrack,
        queue,
        isPlaying,
        currentTime,
        volume,
        play,
        togglePlay,
        setVolume,
      }),
      [currentTrack, queue, isPlaying, currentTime, volume, play, togglePlay, setVolume],
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