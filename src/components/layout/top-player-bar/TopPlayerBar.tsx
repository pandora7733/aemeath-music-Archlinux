import PlayerControlGroup from "./PlayerControlGroup";
import TrackProgress from "./TrackProgress";
import UtilityControlGroup from "./UtilityControlGroup";

export default function TopPlayerBar() {
  return (
    <header className="grid h-16 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-bg-hover bg-bg-elevated/80 px-4 backdrop-blur">
      <PlayerControlGroup />

      <div className="flex justify-center">
        <TrackProgress />
      </div>

      <UtilityControlGroup />
    </header>
  );
}
