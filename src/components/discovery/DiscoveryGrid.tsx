import { useCallback, useEffect, useState } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { usePlugin } from "../../hooks/usePlugin";
import { useDownloads } from "../../hooks/useDownloads";
import { discoveryFetchPreview } from "../../lib/tauri";
import type { DiscoveryTrack } from "../../types/media";
import DiscoveryCard from "./DiscoveryCard";
import PluginConsentDialog from "./PluginConsentDialog";

function downloadQuery(track: DiscoveryTrack): string {
  return `${track.artist} - ${track.title}`;
}

/** Renders online tracks with 30-second preview and yt-dlp download actions.
 *  Shows the plugin consent dialog on first download if yt-dlp is missing. */
export default function DiscoveryGrid({ tracks }: { tracks: DiscoveryTrack[] }) {
  const { play } = usePlayer();
  const { status, installing, progress, install } = usePlugin();
  const { states, lastError, start, cancel } = useDownloads();
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingTrack, setPendingTrack] = useState<DiscoveryTrack | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreview = useCallback(
    async (track: DiscoveryTrack) => {
      if (!track.previewUrl) return;
      setPreviewError(null);
      try {
        const localPath = await discoveryFetchPreview(
          track.previewUrl,
          `${track.source}_${track.externalId}`,
        );
        await play({
          id: `preview-${track.source}-${track.externalId}`,
          path: localPath,
          title: `${track.title} (미리듣기)`,
          artist: track.artist,
          album: track.album ?? undefined,
          duration: 30,
          artworkUrl: track.coverUrl ?? undefined,
        });
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : String(err));
      }
    },
    [play],
  );

  const handleDownload = useCallback(
    (track: DiscoveryTrack) => {
      if (!status?.installed) {
        setPendingTrack(track);
        setConsentOpen(true);
        return;
      }
      void start(downloadQuery(track));
    },
    [status, start],
  );

  const handleCancelDownload = useCallback(
    (track: DiscoveryTrack) => {
      void cancel(downloadQuery(track));
    },
    [cancel],
  );

  const handleConsentConfirm = useCallback(() => {
    void install();
  }, [install]);

  // Close dialog and run the pending download once install completes.
  useEffect(() => {
    if (consentOpen && status?.installed && !installing) {
      setConsentOpen(false);
      if (pendingTrack) {
        void start(downloadQuery(pendingTrack));
        setPendingTrack(null);
      }
    }
  }, [consentOpen, status, installing, pendingTrack, start]);

  if (tracks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-tertiary">
        표시할 곡이 없습니다.
      </p>
    );
  }

  return (
    <>
      {(previewError || lastError) && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          {previewError ?? lastError}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
        {tracks.map((track) => (
          <DiscoveryCard
            key={`${track.source}-${track.externalId}`}
            track={track}
            downloadState={states.get(downloadQuery(track))}
            onPreview={(t) => void handlePreview(t)}
            onDownload={handleDownload}
            onCancelDownload={handleCancelDownload}
          />
        ))}
      </div>

      {consentOpen && (
        <PluginConsentDialog
          installing={installing}
          progress={progress}
          onConfirm={handleConsentConfirm}
          onCancel={() => {
            setConsentOpen(false);
            setPendingTrack(null);
          }}
        />
      )}
    </>
  );
}
