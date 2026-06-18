import { useNavigate } from "react-router-dom";

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

      <main className="flex flex-1 items-center justify-center">
        <p className="text-2xl font-bold text-primary">설정 화면</p>
      </main>
    </div>
  );
}
