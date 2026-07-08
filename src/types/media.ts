export type MediaType = "audio" | "video";
export type MediaSource = "local" | "downloaded";

export interface MediaItem {
  id: string;
  path: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  durationSecs?: number | null;
  mediaType: MediaType;
  extension: string;
  fileSize: number;
  modifiedAt: number;
  coverPath?: string | null;
  addedAt: number;
  source: MediaSource;
}

export interface ScanLibraryResult {
  scanned: number;
  root: string;
}

export interface GetLibraryItemsParams {
  kind?: "audio" | "video" | "all";
  sort?: "title" | "modified";
}

export interface AlbumGroup {
  album: string;
  artist: string;
  trackCount: number;
  coverPath?: string | null;
}

export interface ArtistGroup {
  artist: string;
  trackCount: number;
  albumCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  trackCount: number;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  createdAt: number;
  tracks: MediaItem[];
}

export interface DiscoveryTrack {
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  previewUrl?: string | null;
  source: string;
  externalId: string;
}

export interface PluginStatus {
  id: string;
  name: string;
  installed: boolean;
  version?: string | null;
}

export interface PluginInstallProgress {
  plugin: string;
  progress: number;
}

export interface DownloadEvent {
  id?: string;
  query: string;
  status?: "queued" | "downloading" | "completed" | "failed" | "cancelled";
  message?: string | null;
  trackId?: string | null;
}

export interface DownloadTask {
  id: string;
  query: string;
  status: "queued" | "downloading" | "completed" | "failed" | "cancelled";
  message?: string | null;
  trackId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ExternalDownloadSettings {
  downloadDir: string;
  outputTemplate: string;
}
