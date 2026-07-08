import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DiscoveryGrid from "../components/discovery/DiscoveryGrid";
import DownloadedTrackCard from "../components/discovery/DownloadedTrackCard";
import { useDiscovery } from "../hooks/useDiscovery";
import { getLibraryItems, getMusicRoot, onLibraryUpdated } from "../lib/tauri";
import type { MediaItem } from "../types/media";

export default function HomePage() {
  const { tracks, loading, error, refresh } = useDiscovery("charts");
  const [libraryTracks, setLibraryTracks] = useState<MediaItem[]>([]);
  const [musicRoot, setMusicRoot] = useState<string | null>(null);
  const [downloadedLoading, setDownloadedLoading] = useState(true);
  const [downloadedError, setDownloadedError] = useState<string | null>(null);
  const [showAllMusicTracks, setShowAllMusicTracks] = useState(false);
  const [musicGridCols, setMusicGridCols] = useState(1);
  const musicGridRef = useRef<HTMLDivElement | null>(null);

  const musicRootPrefix = useMemo(() => {
    if (!musicRoot) return null;
    const normalized = musicRoot.replace(/\/+$/, "");
    return `${normalized}/`;
  }, [musicRoot]);

  const downloadedTracks = useMemo(() => {
    if (!musicRootPrefix) return [];
    return libraryTracks.filter(
      (item) => item.path === musicRoot || item.path.startsWith(musicRootPrefix),
    );
  }, [libraryTracks, musicRoot, musicRootPrefix]);

  const visibleMusicTrackCount = useMemo(() => musicGridCols * 2, [musicGridCols]);
  const visibleMusicTracks = useMemo(() => {
    if (showAllMusicTracks) return downloadedTracks;
    return downloadedTracks.slice(0, visibleMusicTrackCount);
  }, [downloadedTracks, showAllMusicTracks, visibleMusicTrackCount]);

  useEffect(() => {
    const node = musicGridRef.current;
    if (!node) return;

    const MIN_CARD_WIDTH = 170;
    const GAP = 12; // gap-3

    const recalc = () => {
      const width = node.clientWidth;
      const cols = Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));
      setMusicGridCols(cols);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    void getMusicRoot()
      .then((root) => setMusicRoot(root))
      .catch(() => setMusicRoot(null));
  }, []);

  const refreshDownloaded = useCallback(async () => {
    setDownloadedLoading(true);
    setDownloadedError(null);
    try {
      const libraryItems = await getLibraryItems({ kind: "audio", sort: "modified" });
      setLibraryTracks(libraryItems);
    } catch (err) {
      setDownloadedError(err instanceof Error ? err.message : String(err));
      setLibraryTracks([]);
    } finally {
      setDownloadedLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDownloaded();
    let unlisten: (() => void) | undefined;
    void onLibraryUpdated(() => void refreshDownloaded()).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, [refreshDownloaded]);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">홈</h1>
          <p className="mt-1 text-xs text-tertiary">온라인 인기곡 + 다운로드한 곡</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-secondary">온라인 인기곡</h2>
        {loading && (
          <p className="py-8 text-center text-sm text-tertiary">
            인기 차트를 불러오는 중...
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
            온라인 차트를 불러올 수 없습니다: {error}
          </div>
        )}

        {!loading && !error && <DiscoveryGrid tracks={tracks} />}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-secondary">
          Music 폴더의 곡
        </h2>

        {downloadedLoading && (
          <p className="py-8 text-center text-sm text-tertiary">
            Music 폴더 곡을 불러오는 중...
          </p>
        )}

        {downloadedError && (
          <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
            Music 폴더 곡을 불러올 수 없습니다: {downloadedError}
          </div>
        )}

        {!downloadedLoading && !downloadedError && musicRoot == null && (
          <p className="py-8 text-center text-sm text-tertiary">
            Music 폴더 경로를 확인할 수 없습니다.
          </p>
        )}

        {!downloadedLoading &&
          !downloadedError &&
          musicRoot != null &&
          downloadedTracks.length === 0 && (
          <p className="py-8 text-center text-sm text-tertiary">
            Music 폴더에 표시할 곡이 없습니다.
          </p>
        )}

        {!downloadedLoading &&
          !downloadedError &&
          musicRoot != null &&
          downloadedTracks.length > 0 && (
          <>
            <div
              ref={musicGridRef}
              className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3"
            >
              {visibleMusicTracks.map((track) => (
                <DownloadedTrackCard
                  key={track.id}
                  track={track}
                  queue={downloadedTracks}
                />
              ))}
            </div>

            {!showAllMusicTracks && downloadedTracks.length > visibleMusicTrackCount && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllMusicTracks(true)}
                  className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary"
                >
                  전체 보기
                </button>
              </div>
            )}
          </>
        )}

        {showAllMusicTracks && downloadedTracks.length > visibleMusicTrackCount && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllMusicTracks(false)}
              className="rounded-md bg-bg-elevated px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary"
            >
              접기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
