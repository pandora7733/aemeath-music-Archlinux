import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePlayer } from "../../../hooks/usePlayer";
import TimeText from "./TimeText";

export default function TrackProgress() {
  const { currentTrack, currentTime, duration, seek } = usePlayer();
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const scrubValueRef = useRef(0);
  const titleWrapRef = useRef<HTMLDivElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);

  const displayTime = scrubTime ?? currentTime;
  const pct = duration > 0 ? (displayTime / duration) * 100 : 0;

  const commitSeek = (time: number) => {
    setScrubTime(null);
    void seek(time);
  };

  useEffect(() => {
    if (!currentTrack) {
      setShouldMarquee(false);
      setMarqueeDistance(0);
      return;
    }

    const measure = () => {
      const wrap = titleWrapRef.current;
      const text = titleTextRef.current;
      if (!wrap || !text) return;

      const overflow = text.scrollWidth > wrap.clientWidth + 2;
      setShouldMarquee(overflow);
      if (overflow) {
        setMarqueeDistance(text.scrollWidth + 24);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (titleWrapRef.current) observer.observe(titleWrapRef.current);
    if (titleTextRef.current) observer.observe(titleTextRef.current);

    return () => observer.disconnect();
  }, [currentTrack?.title]);

  const marqueeStyle: CSSProperties = shouldMarquee
    ? ({
        ["--marquee-distance" as string]: `${marqueeDistance}px`,
        ["--marquee-duration" as string]: `${Math.max(8, marqueeDistance / 36)}s`,
      } as CSSProperties)
    : {};

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-1">
      {currentTrack ? (
        <div className="flex w-full min-w-0 items-baseline gap-2 text-sm">
          <div
            ref={titleWrapRef}
            className={[
              "min-w-0 flex-1 overflow-hidden",
              shouldMarquee ? "marquee marquee-enabled" : "",
            ].join(" ")}
            style={marqueeStyle}
          >
            {shouldMarquee ? (
              <div className="marquee-track">
                <span ref={titleTextRef} className="marquee-item font-medium text-primary">
                  {currentTrack.title}
                </span>
                <span aria-hidden className="marquee-item font-medium text-primary">
                  {currentTrack.title}
                </span>
              </div>
            ) : (
              <span ref={titleTextRef} className="block truncate font-medium text-primary">
                {currentTrack.title}
              </span>
            )}
          </div>
          <span className="max-w-40 shrink-0 truncate text-tertiary">
            {currentTrack.artist}
          </span>
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
