import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlugin } from "../hooks/usePlugin";
import {
  getExternalDownloadSettings,
  resetExternalDownloadSettings,
  updateExternalDownloadSettings,
} from "../lib/tauri";
import type { ExternalDownloadSettings } from "../types/media";

function CloseIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PluginSection() {
  const { status, installing, progress, error, install, update, uninstall } =
    usePlugin();
  const [updateRequested, setUpdateRequested] = useState(false);
  const [updateCompleted, setUpdateCompleted] = useState(false);

  useEffect(() => {
    if (!updateRequested) return;
    if (installing) return;
    if (!error) {
      setUpdateCompleted(true);
    }
    setUpdateRequested(false);
  }, [updateRequested, installing, error]);

  return (
    <section className="w-full max-w-xl rounded-xl border border-bg-hover bg-bg-elevated p-5">
      <h2 className="text-base font-bold text-primary">다운로더 플러그인</h2>
      <p className="mt-1 text-xs text-tertiary">
        곡 다운로드에 사용하는 오픈소스 도구 yt-dlp를 관리합니다. 도구는 앱에
        포함되지 않으며 공식 GitHub 릴리스에서 내려받습니다.
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">yt-dlp</p>
          <p className="text-xs text-tertiary">
            {status?.installed
              ? `설치됨${status.version ? ` · 버전 ${status.version}` : ""}`
              : "설치되지 않음"}
          </p>
        </div>

        <div className="flex gap-2">
          {status?.installed ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setUpdateCompleted(false);
                  setUpdateRequested(true);
                  void update();
                }}
                disabled={installing}
                className="rounded-md bg-bg-hover px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary disabled:opacity-50"
              >
                {installing ? "업데이트 중..." : "업데이트"}
              </button>
              <button
                type="button"
                onClick={() => void uninstall()}
                disabled={installing}
                className="rounded-md bg-bg-hover px-3 py-1.5 text-sm text-secondary transition-colors hover:text-accent disabled:opacity-50"
              >
                삭제
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void install()}
              disabled={installing}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {installing ? "설치 중..." : "설치"}
            </button>
          )}
        </div>
      </div>

      {updateCompleted && (
        <p className="mt-3 text-xs text-accent">업데이트 완료</p>
      )}

      {installing && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-bg-hover">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-tertiary">
            {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-accent">{error}</p>}

      <p className="mt-4 text-[11px] leading-relaxed text-tertiary">
        저작권으로 보호되는 콘텐츠의 다운로드에 대한 책임은 사용자 본인에게
        있습니다. 각 서비스의 이용약관과 거주 국가의 법률을 준수하세요.
      </p>
    </section>
  );
}

function ExternalDownloadSection() {
  const [downloadDir, setDownloadDir] = useState("");
  const [outputTemplate, setOutputTemplate] = useState("");
  const [persisted, setPersisted] = useState<ExternalDownloadSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await getExternalDownloadSettings();
        setDownloadDir(settings.downloadDir);
        setOutputTemplate(settings.outputTemplate);
        setPersisted(settings);
        setSavedLabel(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasChanges =
    persisted == null ||
    persisted.downloadDir !== downloadDir ||
    persisted.outputTemplate !== outputTemplate;

  useEffect(() => {
    if (hasChanges) {
      setSavedLabel(false);
    }
  }, [hasChanges]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateExternalDownloadSettings({
        downloadDir,
        outputTemplate,
      });
      setDownloadDir(updated.downloadDir);
      setOutputTemplate(updated.outputTemplate);
      setPersisted(updated);
      setSavedLabel(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setResetting(true);
    setError(null);
    try {
      const resetSettings = await resetExternalDownloadSettings();
      setDownloadDir(resetSettings.downloadDir);
      setOutputTemplate(resetSettings.outputTemplate);
      setPersisted(resetSettings);
      setSavedLabel(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="w-full max-w-xl rounded-xl border border-bg-hover bg-bg-elevated p-5">
      <h2 className="text-base font-bold text-primary">외부 다운로드 설정</h2>
      <p className="mt-1 text-xs text-tertiary">
        외부 곡 다운로드 하기에서 사용하는 저장 경로와 출력 형식을 설정합니다.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-tertiary">불러오는 중...</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="download-dir"
              className="mb-1 block text-xs font-medium text-tertiary"
            >
              저장 경로
            </label>
            <input
              id="download-dir"
              type="text"
              value={downloadDir}
              onChange={(event) => setDownloadDir(event.target.value)}
              className="w-full rounded-md border border-bg-hover bg-bg-base px-3 py-2 text-sm text-primary outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label
              htmlFor="output-template"
              className="mb-1 block text-xs font-medium text-tertiary"
            >
              출력 형식
            </label>
            <input
              id="output-template"
              type="text"
              value={outputTemplate}
              onChange={(event) => setOutputTemplate(event.target.value)}
              className="w-full rounded-md border border-bg-hover bg-bg-base px-3 py-2 text-sm text-primary outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-[11px] text-tertiary">
              예: %(uploader)s/%(title)s.%(ext)s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || resetting}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "저장 중..." : savedLabel && !hasChanges ? "저장 완료" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => void reset()}
              disabled={saving || resetting}
              className="rounded-md bg-bg-hover px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary disabled:opacity-60"
            >
              {resetting ? "초기화 중..." : "초기화"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-accent">{error}</p>}
    </section>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-bg-base">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <h1 className="text-lg font-bold text-primary">Settings</h1>
        <button
          type="button"
          aria-label="설정 닫기"
          onClick={() => navigate("/")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors outline-none hover:bg-bg-hover hover:text-primary focus-visible:ring-1 focus-visible:ring-accent"
        >
          <CloseIcon />
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center gap-6 overflow-y-auto p-8">
        <PluginSection />
        <ExternalDownloadSection />
      </main>
    </div>
  );
}
