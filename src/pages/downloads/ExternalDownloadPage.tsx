import { useEffect, useState } from "react";
import { useDownloads } from "../../hooks/useDownloads";
import { usePlugin } from "../../hooks/usePlugin";

export default function ExternalDownloadPage() {
  const [url, setUrl] = useState("");
  const [lastRequestedUrl, setLastRequestedUrl] = useState<string | null>(null);
  const [showCompletedLabel, setShowCompletedLabel] = useState(false);
  const { states, lastError, startExternalUrl, cancel } = useDownloads();
  const { status, statusLoading, installing, progress, install } = usePlugin();

  const activeKey = lastRequestedUrl ?? url.trim();
  const state = activeKey ? states.get(activeKey) : undefined;

  useEffect(() => {
    if (!lastRequestedUrl) return;
    if (states.get(lastRequestedUrl) === "done") {
      setShowCompletedLabel(true);
    }
  }, [states, lastRequestedUrl]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-primary">외부 곡 다운로드 하기</h1>
      <p className="mt-2 text-sm text-secondary">
        URL을 넣으면 yt-dlp를 사용해 MP3로 다운로드하고, 메타데이터/썸네일을
        포함해 라이브러리에 자동 등록합니다.
      </p>

      {statusLoading ? (
        <div className="mt-6 rounded-xl border border-bg-hover bg-bg-elevated p-4">
          <p className="text-sm text-secondary">플러그인 상태를 확인하는 중...</p>
        </div>
      ) : !status?.installed ? (
        <div className="mt-6 rounded-xl border border-bg-hover bg-bg-elevated p-4">
          <p className="text-sm text-secondary">
            먼저 yt-dlp를 설치해야 다운로드를 사용할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => void install()}
            disabled={installing}
            className="mt-3 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {installing ? "설치 중..." : "yt-dlp 설치"}
          </button>
          {installing && (
            <p className="mt-2 text-xs text-tertiary">
              설치 진행률: {Math.round(progress * 100)}%
            </p>
          )}
        </div>
      ) : (
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = url.trim();
            if (!trimmed) return;
            setLastRequestedUrl(trimmed);
            setShowCompletedLabel(false);
            void startExternalUrl(trimmed);
          }}
        >
          <label className="block text-sm font-medium text-primary" htmlFor="external-url">
            곡 URL
          </label>
          <input
            id="external-url"
            type="url"
            value={url}
            onChange={(event) => {
              const next = event.target.value;
              setUrl(next);
              // 완료 문구가 보이는 상태에서 URL을 수정하면,
              // 다시 "다운로드 하기" 버튼 모드로 복귀한다.
              if (showCompletedLabel) {
                setShowCompletedLabel(false);
                setLastRequestedUrl(null);
              }
            }}
            placeholder="https://..."
            className="w-full rounded-lg border border-bg-hover bg-bg-elevated px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex items-center gap-2">
            {showCompletedLabel ? (
              <p className="text-sm font-medium text-accent">다운로드 완료</p>
            ) : (
              <button
                type="submit"
                disabled={!url.trim() || state === "downloading"}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {state === "downloading" ? "다운로드 중..." : "다운로드 하기"}
              </button>
            )}
            {state === "downloading" && activeKey && (
              <button
                type="button"
                onClick={() => void cancel(activeKey)}
                className="rounded-md bg-bg-hover px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary"
              >
                취소
              </button>
            )}
          </div>
        </form>
      )}
      {lastError && <p className="mt-4 text-sm text-accent">{lastError}</p>}
    </div>
  );
}
