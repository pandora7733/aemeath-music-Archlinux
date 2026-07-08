const OFFLINE_KEYWORDS = [
  "인터넷 연결이 없어",
  "network is unreachable",
  "no route to host",
  "temporary failure in name resolution",
  "name or service not known",
  "dns error",
  "failed to resolve",
  "getaddrinfo",
  "timed out",
  "timeout",
  "connection refused",
];

export function isOfflineError(error: string | null | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return OFFLINE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function normalizeDiscoveryError(error: string): string {
  if (!isOfflineError(error)) return error;
  return "인터넷 연결이 없어 외부 API에서 곡 정보를 가져올 수 없습니다. 인터넷 연결 후 다시 시도해주세요.";
}

export function normalizeDownloadError(error: string): string {
  if (!isOfflineError(error)) return error;
  return "인터넷 연결이 없어 yt-dlp 다운로드를 진행할 수 없습니다. 인터넷 연결 후 다시 시도해주세요.";
}

export function normalizePreviewError(error: string): string {
  if (!isOfflineError(error)) return error;
  return "인터넷 연결이 없어 미리듣기 파일을 가져올 수 없습니다. 인터넷 연결 후 다시 시도해주세요.";
}
