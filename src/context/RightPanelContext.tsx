import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
  } from "react";
  import type { RightPanelMode } from "../types/ui";
  
  interface RightPanelContextValue {
    mode: RightPanelMode;
    toggleLyrics: () => void;
    toggleQueue: () => void;
    close: () => void;
  }
  
  const RightPanelContext = createContext<RightPanelContextValue | null>(null);
  
  export function RightPanelProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<RightPanelMode>("closed");
  
    const toggleLyrics = useCallback(() => {
      setMode((prev) => (prev === "lyrics" ? "closed" : "lyrics"));
    }, []);
  
    const toggleQueue = useCallback(() => {
      setMode((prev) => (prev === "queue" ? "closed" : "queue"));
    }, []);
  
    const close = useCallback(() => setMode("closed"), []);
  
    const value = useMemo(
      () => ({ mode, toggleLyrics, toggleQueue, close }),
      [mode, toggleLyrics, toggleQueue, close],
    );
  
    return (
      <RightPanelContext.Provider value={value}>
        {children}
      </RightPanelContext.Provider>
    );
  }
  
  export function useRightPanel() {
    const ctx = useContext(RightPanelContext);
    if (!ctx) {
      throw new Error("useRightPanel must be used within RightPanelProvider");
    }
    return ctx;
  }