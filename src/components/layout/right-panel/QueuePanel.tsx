import { usePlayer } from "../../../hooks/usePlayer";
import QueueTrackRow from "./QueueTrackRow";

export default function QueuePanel() {
  const { currentTrack, queue } = usePlayer();

  const currentIndex = currentTrack
    ? queue.findIndex((t) => t.id === currentTrack.id)
    : -1;

  const upNext = currentIndex === -1 ? queue : queue.slice(currentIndex + 1);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
      {currentTrack && (
        <section className="mb-4">
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
            지금 재생 중
          </p>
          <QueueTrackRow track={currentTrack} isCurrent />
        </section>
      )}

      <section>
        <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
          다음 트랙
        </p>
        {upNext.length > 0 ? (
          <ul className="space-y-0.5">
            {upNext.map((track) => (
              <li key={track.id}>
                <QueueTrackRow track={track} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-4 text-sm text-tertiary">
            다음에 재생할 트랙이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
