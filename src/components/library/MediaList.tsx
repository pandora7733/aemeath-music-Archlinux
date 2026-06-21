import type { MediaItem } from "../../types/media";
import MediaRow from "./MediaRow";

export default function MediaList({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-tertiary">
        표시할 음원이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-bg-hover rounded-lg border border-bg-hover">
      {items.map((item) => (
        <li key={item.id}>
          <MediaRow item={item} queue={items} />
        </li>
      ))}
    </ul>
  );
}
