import { invoke } from "@tauri-apps/api/core";
import type {
  GetLibraryItemsParams,
  MediaItem,
  ScanLibraryResult,
} from "../types/media";

export interface PlaybackState {
  path: string | null;
  isPlaying: boolean;
  positionSecs: number;
  durationSecs: number;
  volume: number;
}

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
