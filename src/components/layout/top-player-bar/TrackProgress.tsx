import { useRef, useState } from "react";
import { usePlayer } from "../../../hooks/usePlayer";
import TimeText from "./TimeText";

export default function TrackProgress() {
  const { currentTrack, currentTime, duration, seek } = usePlayer();
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const scrubValueRef = useRef(0);

  const displayTime = scrubTime ?? currentTime;
  const pct = duration > 0 ? (displayTime / duration) * 100 : 0;

  const commitSeek = (time: number) => {
    setScrubTime(null);
    void seek(time);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-1">
      {currentTrack ? (
        <div className="flex items-baseline gap-2 truncate text-center text-sm">
          <span className="truncate font-medium text-primary">
            {currentTrack.title}
          </span>
          <span className="truncate text-tertiary">{currentTrack.artist}</span>
        </div>
      ) : (
        <span className="text-sm text-tertiary">재생 중인 곡 없음</span>
      )}

      <div className="flex w-full items-center gap-2">
        <TimeText seconds={displayTime} />

        <div className="group relative flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={displayTime}
            onInput={(e) => {
              const next = Number(e.currentTarget.value);
              scrubValueRef.current = next;
              setScrubTime(next);
            }}
            onPointerUp={() => {
              commitSeek(scrubValueRef.current);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                commitSeek(Number(e.currentTarget.value));
              }
            }}
            onBlur={() => {
              if (scrubTime !== null) {
                commitSeek(scrubValueRef.current);
              }
            }}
            aria-label="재생 위치"
            disabled={!currentTrack}
            className="peer absolute inset-0 z-10 h-4 w-full cursor-pointer opacity-0 disabled:cursor-default"
          />
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
            <div
              className={[
                "h-full rounded-full bg-primary group-hover:bg-accent",
                scrubTime === null ? "transition-[width]" : "",
              ].join(" ")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <TimeText seconds={duration} />
      </div>
    </div>
  );
}
