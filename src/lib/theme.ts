export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "aemeath.theme";
const DEFAULT_THEME: ThemeMode = "dark";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(value) ? value : DEFAULT_THEME;
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function persistTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/** Applies persisted theme before React mount to reduce visual flicker. */
export function bootstrapTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}
