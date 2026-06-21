import { invoke } from "@tauri-apps/api/core";
import type {
  GetLibraryItemsParams,
  MediaItem,
  ScanLibraryResult,
} from "../types/media";

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
