import { usePlayer } from "../../../hooks/usePlayer";
import IconButton from "./IconButton";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShuffleIcon,
} from "./icons";

export default function PlayerControlGroup() {
  const {
    isPlaying,
    isShuffle,
    repeatMode,
    queue,
    currentTrack,
    togglePlay,
    toggleShuffle,
    cycleRepeat,
    next,
    prev,
  } = usePlayer();

  const hasQueue = queue.length > 0 && currentTrack != null;

  return (
    <div className="flex items-center gap-1">
      <IconButton
        label="셔플 재생"
        active={isShuffle}
        onClick={toggleShuffle}
      >
        <ShuffleIcon />
      </IconButton>

      <IconButton label="이전 곡" onClick={() => void prev()} disabled={!hasQueue}>
        <PrevIcon />
      </IconButton>

      <IconButton
        label={isPlaying ? "일시중지" : "재생"}
        variant="primary"
        onClick={() => void togglePlay()}
        disabled={!hasQueue}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </IconButton>

      <IconButton label="다음 곡" onClick={() => void next()} disabled={!hasQueue}>
        <NextIcon />
      </IconButton>

      <IconButton
        label={
          repeatMode === "one"
            ? "한 곡 반복"
            : repeatMode === "all"
              ? "전체 반복"
              : "반복 안 함"
        }
        active={repeatMode !== "off"}
        onClick={cycleRepeat}
        className="relative"
      >
        <RepeatIcon />
        {repeatMode === "one" && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-bg-base">
            1
          </span>
        )}
      </IconButton>
    </div>
  );
}
