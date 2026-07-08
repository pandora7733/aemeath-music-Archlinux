interface PluginConsentDialogProps {
  installing: boolean;
  progress: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Consent dialog shown before downloading the yt-dlp binary at runtime.
 *  The binary is NOT bundled with the app; it is fetched from the official
 *  yt-dlp GitHub release only after the user agrees. */
export default function PluginConsentDialog({
  installing,
  progress,
  onConfirm,
  onCancel,
}: PluginConsentDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[480px] rounded-xl border border-bg-hover bg-bg-elevated p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-primary">다운로더 설치 동의</h2>

        <div className="mt-3 space-y-2 text-sm text-secondary">
          <p>
            곡 다운로드 기능을 사용하려면 오픈소스 도구{" "}
            <span className="font-semibold text-primary">yt-dlp</span>가
            필요합니다. 이 도구는 앱에 포함되어 있지 않으며, 동의하시면{" "}
            <span className="font-semibold text-primary">
              yt-dlp 공식 GitHub 릴리스
            </span>
            에서 내려받아 설치합니다.
          </p>
          <p className="text-xs text-tertiary">
            yt-dlp는 퍼블릭 도메인(Unlicense) 소프트웨어입니다. 저작권으로
            보호되는 콘텐츠의 다운로드에 대한 책임은 사용자 본인에게 있으며, 각
            서비스의 이용약관과 거주 국가의 법률을 준수해야 합니다.
          </p>
        </div>

        {installing && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-bg-hover">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-tertiary">
              설치 중... {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={installing}
            className="rounded-md px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-bg-hover hover:text-primary disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={installing}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {installing ? "설치 중..." : "동의하고 설치"}
          </button>
        </div>
      </div>
    </div>
  );
}
