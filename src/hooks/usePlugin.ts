import { useCallback, useEffect, useState } from "react";
import {
  onPluginInstallError,
  onPluginInstallProgress,
  pluginInstall,
  pluginUninstall,
  pluginUpdate,
  pluginStatus,
} from "../lib/tauri";
import type { PluginStatus } from "../types/media";

let cachedPluginStatus: PluginStatus | null = null;
let inflightStatusRequest: Promise<PluginStatus> | null = null;

async function fetchPluginStatusCached(
  forceRefresh = false,
): Promise<PluginStatus> {
  if (!forceRefresh && cachedPluginStatus) {
    return cachedPluginStatus;
  }

  if (!inflightStatusRequest) {
    inflightStatusRequest = pluginStatus()
      .then((status) => {
        cachedPluginStatus = status;
        return status;
      })
      .finally(() => {
        inflightStatusRequest = null;
      });
  }

  return inflightStatusRequest;
}

export function primePluginStatusCache() {
  void fetchPluginStatusCached().catch(() => {
    // 최초 프라임 실패 시 훅에서 재시도한다.
  });
}

/** yt-dlp plugin install state. Install runs in the backend; progress arrives
 *  via `plugin-install-progress` events. */
export function usePlugin() {
  const [status, setStatus] = useState<PluginStatus | null>(cachedPluginStatus);
  const [statusLoading, setStatusLoading] = useState(cachedPluginStatus == null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (cachedPluginStatus == null) {
      setStatusLoading(true);
    }
    try {
      const nextStatus = await fetchPluginStatusCached(true);
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const install = useCallback(async () => {
    setInstalling(true);
    setProgress(0);
    setError(null);
    try {
      await pluginInstall();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstalling(false);
    }
  }, []);

  const update = useCallback(async () => {
    setInstalling(true);
    setProgress(0);
    setError(null);
    try {
      await pluginUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstalling(false);
    }
  }, []);

  const uninstall = useCallback(async () => {
    setInstalling(true);
    setError(null);
    try {
      const nextStatus = await pluginUninstall();
      cachedPluginStatus = nextStatus;
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInstalling(false);
      setProgress(0);
    }
  }, [refresh]);

  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    void (async () => {
      unlisteners.push(
        await onPluginInstallProgress((event) => {
          setProgress(event.progress);
          if (event.progress >= 1) {
            setInstalling(false);
            void refresh();
          }
        }),
        await onPluginInstallError((message) => {
          setError(message);
          setInstalling(false);
        }),
      );
    })();
    return () => unlisteners.forEach((fn) => fn());
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    statusLoading,
    installing,
    progress,
    error,
    install,
    update,
    uninstall,
    refresh,
  };
}
