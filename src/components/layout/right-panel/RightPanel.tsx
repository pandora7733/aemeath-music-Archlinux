import { useRightPanel } from "../../../hooks/useRightPanel";
import PanelHeader from "./PanelHeader";
import LyricsPanel from "./LyricsPanel";
import QueuePanel from "./QueuePanel";

export default function RightPanel() {
  const { mode } = useRightPanel();

  if (mode === "closed") return null;

  return (
    <aside className="flex w-right-panel shrink-0 flex-col border-l border-bg-hover bg-bg-elevated">
      <PanelHeader title={mode === "lyrics" ? "가사" : "재생 목록"} />
      {mode === "lyrics" ? <LyricsPanel /> : <QueuePanel />}
    </aside>
  );
}
