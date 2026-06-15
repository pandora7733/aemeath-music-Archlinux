// TopPlayerBar.tsx
import { usePlayer } from "../../../hooks/usePlayer";
import { useRightPanel } from "../../../hooks/useRightPanel";

export default function TopPlayerBar() {
  const { currentTrack, togglePlay, isPlaying } = usePlayer();
  const { toggleLyrics, toggleQueue, mode } = useRightPanel();

  return (
    <header>
      <span>{currentTrack?.title}</span>
      <button onClick={togglePlay}>{isPlaying ? "Pause" : "Play"}</button>
      <button onClick={toggleLyrics} data-active={mode === "lyrics"}>
        자막
      </button>
      <button onClick={toggleQueue} data-active={mode === "queue"}>
        리스트
      </button>
    </header>
  );
}