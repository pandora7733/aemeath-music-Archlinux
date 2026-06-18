export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TimeText({
  seconds,
  className = "",
}: {
  seconds: number;
  className?: string;
}) {
  return (
    <span className={`tabular-nums text-xs text-tertiary ${className}`}>
      {formatTime(seconds)}
    </span>
  );
}
