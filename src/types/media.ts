export type MediaType = "audio" | "video";

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
}

export interface ScanLibraryResult {
  scanned: number;
  root: string;
}

export interface GetLibraryItemsParams {
  kind?: "audio" | "video" | "all";
  sort?: "title" | "modified";
}
