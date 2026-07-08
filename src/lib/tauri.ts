import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AlbumGroup,
  ArtistGroup,
  DiscoveryTrack,
  DownloadEvent,
  ExternalDownloadSettings,
  DownloadTask,
  GetLibraryItemsParams,
  MediaItem,
  Playlist,
  PlaylistDetail,
  PluginInstallProgress,
  PluginStatus,
  ScanLibraryResult,
} from "../types/media";

export interface PlaybackState {
  path: string | null;
  isPlaying: boolean;
  positionSecs: number;
  durationSecs: number;
  volume: number;
}

// ----- Library -----

export async function scanLibrary(roots?: string[]): Promise<ScanLibraryResult> {
  return invoke<ScanLibraryResult>("scan_library", {
    params: roots ? { roots } : undefined,
  });
}

export async function getLibraryItems(
  params?: GetLibraryItemsParams,
): Promise<MediaItem[]> {
  return invoke<MediaItem[]>("get_library_items", { params });
}

export async function getRecentlyAdded(limit?: number): Promise<MediaItem[]> {
  return invoke<MediaItem[]>("get_recently_added", { limit });
}

export async function getAlbums(): Promise<AlbumGroup[]> {
  return invoke<AlbumGroup[]>("get_albums");
}

export async function getAlbumTracks(
  artist: string,
  album: string,
): Promise<MediaItem[]> {
  return invoke<MediaItem[]>("get_album_tracks", { artist, album });
}

export async function getArtists(): Promise<ArtistGroup[]> {
  return invoke<ArtistGroup[]>("get_artists");
}

export async function getArtistTracks(artist: string): Promise<MediaItem[]> {
  return invoke<MediaItem[]>("get_artist_tracks", { artist });
}

export async function getMusicRoot(): Promise<string> {
  return invoke<string>("get_music_root");
}

// ----- Favorites -----

export async function favoriteToggle(trackId: string): Promise<boolean> {
  return invoke<boolean>("favorite_toggle", { trackId });
}

export async function favoriteIds(): Promise<string[]> {
  return invoke<string[]>("favorite_ids");
}

export async function favoriteList(): Promise<MediaItem[]> {
  return invoke<MediaItem[]>("favorite_list");
}

// ----- Playlists -----

export async function playlistCreate(name: string): Promise<Playlist> {
  return invoke<Playlist>("playlist_create", { name });
}

export async function playlistRename(id: string, name: string): Promise<void> {
  return invoke<void>("playlist_rename", { id, name });
}

export async function playlistDelete(id: string): Promise<void> {
  return invoke<void>("playlist_delete", { id });
}

export async function playlistList(): Promise<Playlist[]> {
  return invoke<Playlist[]>("playlist_list");
}

export async function playlistGet(id: string): Promise<PlaylistDetail> {
  return invoke<PlaylistDetail>("playlist_get", { id });
}

export async function playlistAddTrack(
  playlistId: string,
  trackId: string,
): Promise<void> {
  return invoke<void>("playlist_add_track", { playlistId, trackId });
}

export async function playlistRemoveTrack(
  playlistId: string,
  trackId: string,
): Promise<void> {
  return invoke<void>("playlist_remove_track", { playlistId, trackId });
}

export async function playlistReorder(
  playlistId: string,
  orderedIds: string[],
): Promise<void> {
  return invoke<void>("playlist_reorder", { playlistId, orderedIds });
}

// ----- Discovery -----

export async function discoveryCharts(): Promise<DiscoveryTrack[]> {
  return invoke<DiscoveryTrack[]>("discovery_charts");
}

export async function discoveryReleases(): Promise<DiscoveryTrack[]> {
  return invoke<DiscoveryTrack[]>("discovery_releases");
}

export async function discoverySearch(query: string): Promise<DiscoveryTrack[]> {
  return invoke<DiscoveryTrack[]>("discovery_search", { query });
}

export async function discoveryFetchPreview(
  previewUrl: string,
  externalId: string,
): Promise<string> {
  return invoke<string>("discovery_fetch_preview", { previewUrl, externalId });
}

// ----- Plugin (yt-dlp) -----

export async function pluginStatus(): Promise<PluginStatus> {
  return invoke<PluginStatus>("plugin_status");
}

export async function pluginInstall(): Promise<PluginStatus> {
  return invoke<PluginStatus>("plugin_install");
}

export async function pluginUpdate(): Promise<PluginStatus> {
  return invoke<PluginStatus>("plugin_update");
}

export async function pluginUninstall(): Promise<PluginStatus> {
  return invoke<PluginStatus>("plugin_uninstall");
}

// ----- Download -----

export async function downloadTrack(query: string): Promise<DownloadTask> {
  return invoke<DownloadTask>("download_track", { query });
}

export async function downloadExternalUrl(url: string): Promise<DownloadTask> {
  return invoke<DownloadTask>("download_external_url", { url });
}

export async function downloadList(): Promise<DownloadTask[]> {
  return invoke<DownloadTask[]>("download_list");
}

export async function downloadCancel(id: string): Promise<void> {
  return invoke<void>("download_cancel", { id });
}

export async function getExternalDownloadSettings(): Promise<ExternalDownloadSettings> {
  return invoke<ExternalDownloadSettings>("external_download_settings_get");
}

export async function updateExternalDownloadSettings(
  settings: ExternalDownloadSettings,
): Promise<ExternalDownloadSettings> {
  return invoke<ExternalDownloadSettings>("external_download_settings_update", {
    settings,
  });
}

export async function resetExternalDownloadSettings(): Promise<ExternalDownloadSettings> {
  return invoke<ExternalDownloadSettings>("external_download_settings_reset");
}

// ----- Player -----

export async function playerPlay(path: string): Promise<PlaybackState> {
  return invoke<PlaybackState>("player_play", { path });
}

export async function playerTogglePause(): Promise<PlaybackState> {
  return invoke<PlaybackState>("player_toggle_pause");
}

export async function playerSetVolume(volume: number): Promise<PlaybackState> {
  return invoke<PlaybackState>("player_set_volume", { volume });
}

export async function playerSeek(positionSecs: number): Promise<PlaybackState> {
  return invoke<PlaybackState>("player_seek", { positionSecs });
}

export async function playerGetState(): Promise<PlaybackState> {
  return invoke<PlaybackState>("player_get_state");
}

// ----- Events -----

export function onPluginInstallProgress(
  handler: (progress: PluginInstallProgress) => void,
): Promise<UnlistenFn> {
  return listen<PluginInstallProgress>("plugin-install-progress", (event) =>
    handler(event.payload),
  );
}

export function onPluginInstallError(
  handler: (message: string) => void,
): Promise<UnlistenFn> {
  return listen<string>("plugin-install-error", (event) =>
    handler(event.payload),
  );
}

export function onDownloadProgress(
  handler: (event: DownloadEvent) => void,
): Promise<UnlistenFn> {
  return listen<DownloadEvent>("download-progress", (event) =>
    handler(event.payload),
  );
}

export function onDownloadComplete(
  handler: (event: DownloadEvent) => void,
): Promise<UnlistenFn> {
  return listen<DownloadEvent>("download-complete", (event) =>
    handler(event.payload),
  );
}

export function onDownloadError(
  handler: (event: DownloadEvent) => void,
): Promise<UnlistenFn> {
  return listen<DownloadEvent>("download-error", (event) =>
    handler(event.payload),
  );
}

export function onLibraryUpdated(handler: () => void): Promise<UnlistenFn> {
  return listen("library-updated", () => handler());
}
