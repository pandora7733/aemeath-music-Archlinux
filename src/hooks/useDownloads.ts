import { useCallback, useEffect, useState } from "react";
import {
  downloadCancel,
  downloadExternalUrl,
  downloadList,
  downloadTrack,
  onDownloadComplete,
  onDownloadError,
  onDownloadProgress,
} from "../lib/tauri";
import { normalizeDownloadError } from "../lib/networkError";
import type { DownloadTask } from "../types/media";

export type DownloadState = "downloading" | "done" | "error";

/** Tracks per-query download state driven by backend events. */
export function useDownloads() {
  const [states, setStates] = useState<Map<string, DownloadState>>(new Map());
  const [taskIdsByQuery, setTaskIdsByQuery] = useState<Map<string, string>>(new Map());
  const [lastError, setLastError] = useState<string | null>(null);

  const start = useCallback(async (query: string) => {
    setLastError(null);
    setStates((prev) => new Map(prev).set(query, "downloading"));
    try {
      const task = await downloadTrack(query);
      setTaskIdsByQuery((prev) => new Map(prev).set(query, task.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastError(normalizeDownloadError(message));
      setStates((prev) => new Map(prev).set(query, "error"));
    }
  }, []);

  const startExternalUrl = useCallback(async (url: string) => {
    setLastError(null);
    setStates((prev) => new Map(prev).set(url, "downloading"));
    try {
      const task = await downloadExternalUrl(url);
      setTaskIdsByQuery((prev) => new Map(prev).set(url, task.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastError(normalizeDownloadError(message));
      setStates((prev) => new Map(prev).set(url, "error"));
    }
  }, []);

  const cancel = useCallback(
    async (query: string) => {
      const taskId = taskIdsByQuery.get(query);
      if (!taskId) return;
      try {
        await downloadCancel(taskId);
        setStates((prev) => new Map(prev).set(query, "error"));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLastError(normalizeDownloadError(message));
      }
    },
    [taskIdsByQuery],
  );

  const hydrateFromQueue = useCallback(async () => {
    try {
      const tasks: DownloadTask[] = await downloadList();
      const nextStates = new Map<string, DownloadState>();
      const nextIds = new Map<string, string>();

      for (const task of tasks) {
        nextIds.set(task.query, task.id);
        if (task.status === "downloading" || task.status === "queued") {
          nextStates.set(task.query, "downloading");
        } else if (task.status === "completed") {
          nextStates.set(task.query, "done");
        } else {
          nextStates.set(task.query, "error");
        }
      }

      setTaskIdsByQuery(nextIds);
      setStates(nextStates);
    } catch {
      // queue sync 실패 시 이벤트 기반 상태만 유지
    }
  }, []);

  useEffect(() => {
    const unlisteners: (() => void)[] = [];
    void hydrateFromQueue();
    void (async () => {
      unlisteners.push(
        await onDownloadProgress((event) => {
          setStates((prev) => new Map(prev).set(event.query, "downloading"));
          if (event.id) {
            setTaskIdsByQuery((prev) => new Map(prev).set(event.query, event.id!));
          }
        }),
        await onDownloadComplete((event) => {
          setStates((prev) => new Map(prev).set(event.query, "done"));
          if (event.id) {
            setTaskIdsByQuery((prev) => new Map(prev).set(event.query, event.id!));
          }
        }),
        await onDownloadError((event) => {
          setLastError(normalizeDownloadError(event.message ?? "다운로드 실패"));
          setStates((prev) => new Map(prev).set(event.query, "error"));
          if (event.id) {
            setTaskIdsByQuery((prev) => new Map(prev).set(event.query, event.id!));
          }
        }),
      );
    })();
    return () => unlisteners.forEach((fn) => fn());
  }, [hydrateFromQueue]);

  return { states, lastError, start, startExternalUrl, cancel };
}
