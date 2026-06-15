// RightPanel.tsx
import { useRightPanel } from "../../../hooks/useRightPanel";

export default function RightPanel() {
  const { mode } = useRightPanel();
  if (mode === "lyrics") return <div>가사 영역</div>;
  if (mode === "queue") return <div>큐 영역</div>;
  return null;
}