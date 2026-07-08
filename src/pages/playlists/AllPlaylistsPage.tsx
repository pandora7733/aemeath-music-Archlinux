import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlaylists } from "../../hooks/usePlaylists";

export default function AllPlaylistsPage() {
  const { playlists, loading, error, create, remove, rename } = usePlaylists();
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setActionError(null);
    try {
      await create(newName);
      setNewName("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRename = async (id: string) => {
    setActionError(null);
    try {
      await rename(id, renameValue);
      setRenamingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-primary">모든 플레이리스트</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleCreate();
          }}
          placeholder="새 플레이리스트 이름"
          className="w-64 rounded-md border border-bg-hover bg-bg-elevated px-3 py-1.5 text-sm text-primary placeholder:text-tertiary focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!newName.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          만들기
        </button>
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {actionError ?? error}
        </div>
      )}

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">불러오는 중...</p>
      )}

      {!loading && playlists.length === 0 && (
        <p className="py-8 text-center text-sm text-tertiary">
          아직 플레이리스트가 없습니다. 위에서 새로 만들어 보세요.
        </p>
      )}

      <ul className="divide-y divide-bg-hover rounded-lg border border-bg-hover">
        {playlists.map((playlist) => (
          <li
            key={playlist.id}
            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-bg-hover"
          >
            {renamingId === playlist.id ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleRename(playlist.id);
                    if (event.key === "Escape") setRenamingId(null);
                  }}
                  autoFocus
                  className="w-56 rounded-md border border-bg-hover bg-bg-elevated px-2 py-1 text-sm text-primary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleRename(playlist.id)}
                  className="text-xs text-accent hover:underline"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className="text-xs text-tertiary hover:underline"
                >
                  취소
                </button>
              </div>
            ) : (
              <Link
                to={`/playlists/${playlist.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium text-primary">
                  {playlist.name}
                </p>
                <p className="text-xs text-tertiary">{playlist.trackCount}곡</p>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setRenamingId(playlist.id);
                setRenameValue(playlist.name);
              }}
              className="shrink-0 text-xs text-secondary transition-colors hover:text-primary"
            >
              이름 변경
            </button>
            <button
              type="button"
              onClick={() => void remove(playlist.id)}
              className="shrink-0 text-xs text-secondary transition-colors hover:text-accent"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
