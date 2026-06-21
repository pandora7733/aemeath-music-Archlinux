import { usePlayer } from "../../../hooks/usePlayer";
import { useRightPanel } from "../../../hooks/useRightPanel";
import IconButton from "./IconButton";
import { LyricsIcon, QueueIcon, VolumeIcon, VolumeMuteIcon } from "./icons";

export default function UtilityControlGroup() {
  const { volume, setVolume } = usePlayer();
  const { mode, toggleLyrics, toggleQueue } = useRightPanel();

  const isMuted = volume === 0;

  return (
    <div className="flex items-center justify-end gap-1">
      <div className="flex items-center gap-1.5">
        <IconButton
          label={isMuted ? "음소거 해제" : "음소거"}
          onClick={() => setVolume(isMuted ? 0.8 : 0)}
        >
          {isMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
        </IconButton>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => void setVolume(Number(e.target.value))}
          aria-label="볼륨 조절"
          className="h-1 w-20 cursor-pointer accent-[var(--accent)]"
        />
      </div>

      <IconButton
        label="가사 보기"
        active={mode === "lyrics"}
        onClick={toggleLyrics}
      >
        <LyricsIcon />
      </IconButton>

      <IconButton
        label="재생 목록 보기"
        active={mode === "queue"}
        onClick={toggleQueue}
      >
        <QueueIcon />
      </IconButton>
    </div>
  );
}
