import { usePlayer } from "../../../hooks/usePlayer";
import NowPlayingMini from "./NowPlayingMini";

export default function LyricsPanel() {
  const { currentTrack, currentTime, duration } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-tertiary">
        재생 중인 곡이 없습니다.
      </div>
    );
  }

  const lyrics = currentTrack.lyrics ?? [];

  // 가사 데이터가 없을 때를 대비한 mock 진행 라인 추정
  const activeLine =
    lyrics.length > 0 && duration > 0
      ? Math.min(
          lyrics.length - 1,
          Math.floor((currentTime / duration) * lyrics.length),
        )
      : -1;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <NowPlayingMini track={currentTrack} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {lyrics.length > 0 ? (
          <ul className="space-y-3">
            {lyrics.map((line, idx) => (
              <li
                key={idx}
                className={[
                  "text-base leading-relaxed transition-colors",
                  idx === activeLine
                    ? "font-semibold text-primary"
                    : "text-tertiary",
                ].join(" ")}
              >
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-tertiary">
            이 곡에 표시할 가사가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
