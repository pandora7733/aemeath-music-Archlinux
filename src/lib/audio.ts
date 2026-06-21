import { convertFileSrc } from "@tauri-apps/api/core";

export { convertFileSrc };

export function toAudioSrc(filePath: string): string {
  return convertFileSrc(filePath);
}
