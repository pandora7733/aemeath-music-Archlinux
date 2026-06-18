import { useRightPanel } from "../../../hooks/useRightPanel";
import IconButton from "../top-player-bar/IconButton";
import { CloseIcon } from "../top-player-bar/icons";

export default function PanelHeader({ title }: { title: string }) {
  const { close } = useRightPanel();

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-bg-hover px-4">
      <h2 className="text-sm font-semibold text-primary">{title}</h2>
      <IconButton label="패널 닫기" onClick={close}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
