use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::infrastructure::db::Database;
use crate::infrastructure::plugins::ytdlp;
use crate::infrastructure::scanner;
use crate::models::download_task::{DownloadStatus, DownloadTask};
use crate::models::media_item::MediaSource;
use crate::services::paths;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalDownloadSettings {
    pub download_dir: String,
    pub output_template: String,
}

impl Default for ExternalDownloadSettings {
    fn default() -> Self {
        Self {
            download_dir: paths::music_dir().to_string_lossy().to_string(),
            output_template: "%(uploader)s/%(title)s.%(ext)s".to_string(),
        }
    }
}

#[derive(Clone, Copy)]
enum DownloadKind {
    SearchQuery,
    ExternalUrl,
}

#[derive(Clone)]
pub struct DownloadService {
    tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    pids: Arc<Mutex<HashMap<String, u32>>>,
}

impl DownloadService {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            pids: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Enqueues a yt-dlp search download and starts it in the background.
    pub fn enqueue(
        &self,
        db: Arc<Database>,
        app: AppHandle,
        query: String,
    ) -> Result<DownloadTask, String> {
        self.enqueue_internal(db, app, query, DownloadKind::SearchQuery)
    }

    /// Enqueues a direct URL download using the external-download preset:
    /// mp3 conversion + metadata + thumbnails + info json.
    pub fn enqueue_external_url(
        &self,
        db: Arc<Database>,
        app: AppHandle,
        url: String,
    ) -> Result<DownloadTask, String> {
        self.enqueue_internal(db, app, url, DownloadKind::ExternalUrl)
    }

    pub fn get_external_settings(&self) -> Result<ExternalDownloadSettings, String> {
        load_external_settings()
    }

    pub fn update_external_settings(
        &self,
        settings: ExternalDownloadSettings,
    ) -> Result<ExternalDownloadSettings, String> {
        save_external_settings(&settings)
    }

    pub fn reset_external_settings(&self) -> Result<ExternalDownloadSettings, String> {
        save_external_settings(&ExternalDownloadSettings::default())
    }

    pub fn list(&self) -> Result<Vec<DownloadTask>, String> {
        let tasks = self
            .tasks
            .lock()
            .map_err(|_| "다운로드 큐 잠금에 실패했습니다.".to_string())?;
        let mut values: Vec<DownloadTask> = tasks.values().cloned().collect();
        values.sort_by_key(|task| std::cmp::Reverse(task.created_at));
        Ok(values)
    }

    pub fn cancel(&self, id: &str) -> Result<(), String> {
        update_task(&self.tasks, id, |task| {
            task.status = DownloadStatus::Cancelled;
            task.message = Some("취소 요청됨".to_string());
        })?;

        let pid = self
            .pids
            .lock()
            .map_err(|_| "다운로드 프로세스 잠금에 실패했습니다.".to_string())?
            .remove(id);

        if let Some(pid) = pid {
            let status = terminate_process(pid).map_err(|e| format!("다운로드 취소 실패: {e}"))?;
            if !status.success() {
                return Err("다운로드 취소 신호 전송에 실패했습니다.".to_string());
            }
        }

        Ok(())
    }

    /// Best-effort termination of every in-flight yt-dlp child process. Called
    /// when the app is quitting so no orphaned downloader/ffmpeg processes are
    /// left running after the window closes.
    pub fn shutdown(&self) {
        let pids: Vec<u32> = match self.pids.lock() {
            Ok(mut map) => map.drain().map(|(_, pid)| pid).collect(),
            Err(_) => return,
        };
        for pid in pids {
            let _ = terminate_process(pid);
        }
    }

    fn upsert_task(&self, task: DownloadTask) -> Result<(), String> {
        let mut tasks = self
            .tasks
            .lock()
            .map_err(|_| "다운로드 큐 잠금에 실패했습니다.".to_string())?;
        tasks.insert(task.id.clone(), task);
        Ok(())
    }

    fn emit_progress(&self, app: &AppHandle, task: &DownloadTask) {
        let _ = app.emit("download-progress", task);
    }

    fn enqueue_internal(
        &self,
        db: Arc<Database>,
        app: AppHandle,
        input: String,
        kind: DownloadKind,
    ) -> Result<DownloadTask, String> {
        if !ytdlp::is_installed() {
            return Err("yt-dlp가 설치되지 않았습니다. 먼저 다운로더를 설치하세요.".to_string());
        }
        let external_settings = match kind {
            DownloadKind::ExternalUrl => {
                let settings = load_external_settings()?;
                validate_output_template(&settings.output_template)?;
                Some(settings)
            }
            DownloadKind::SearchQuery => None,
        };

        let now = now_ts();
        let id = new_task_id(&input, now);
        let initial = DownloadTask {
            id: id.clone(),
            query: input.clone(),
            status: DownloadStatus::Queued,
            message: Some("대기 중".to_string()),
            track_id: None,
            created_at: now,
            updated_at: now,
        };

        self.upsert_task(initial.clone())?;
        self.emit_progress(&app, &initial);

        let tasks = self.tasks.clone();
        let pids = self.pids.clone();
        thread::spawn(move || {
            let _ = update_task(&tasks, &id, |task| {
                task.status = DownloadStatus::Downloading;
                task.message = Some(match kind {
                    DownloadKind::SearchQuery => "다운로드 시작".to_string(),
                    DownloadKind::ExternalUrl => "외부 URL 다운로드 시작".to_string(),
                });
            })
            .map(|task| {
                let _ = app.emit("download-progress", task);
            });

            let run = match kind {
                DownloadKind::SearchQuery => {
                    ytdlp::download_audio_with_pid(&input, &paths::songs_dir(), |pid| {
                        if let Ok(mut map) = pids.lock() {
                            map.insert(id.clone(), pid);
                        }
                    })
                }
                DownloadKind::ExternalUrl => {
                    let settings = external_settings.clone().unwrap_or_default();
                    let base_dir = PathBuf::from(&settings.download_dir);
                    if let Err(e) = std::fs::create_dir_all(&base_dir) {
                        emit_terminal_error(
                            &tasks,
                            &app,
                            &id,
                            &format!("저장 디렉터리 생성 실패: {e}"),
                        );
                        return;
                    }
                    let output_path = base_dir.join(&settings.output_template);
                    let output_template = output_path.to_string_lossy().to_string();
                    ytdlp::download_from_url_as_mp3_with_pid(&input, &output_template, |pid| {
                        if let Ok(mut map) = pids.lock() {
                            map.insert(id.clone(), pid);
                        }
                    })
                }
            };

            if let Ok(mut map) = pids.lock() {
                map.remove(&id);
            }

            match run {
                Ok(file_path) => {
                    let mut item = match scanner::media_item_from_path(&file_path) {
                        Some(item) => item,
                        None => {
                            emit_terminal_error(
                                &tasks,
                                &app,
                                &id,
                                "다운로드한 파일을 인식할 수 없습니다.",
                            );
                            return;
                        }
                    };
                    item.source = MediaSource::Downloaded;

                    if let Err(e) = db.upsert_tracks(&[item.clone()]) {
                        emit_terminal_error(&tasks, &app, &id, &e);
                        return;
                    }

                    let _ = update_task(&tasks, &id, |task| {
                        task.status = DownloadStatus::Completed;
                        task.message = Some("완료".to_string());
                        task.track_id = Some(item.id.clone());
                    })
                    .map(|task| {
                        let _ = app.emit("download-complete", task);
                    });
                    let _ = app.emit("library-updated", ());
                }
                Err(e) => {
                    let cancelled = is_cancelled(&tasks, &id);
                    if cancelled {
                        let _ = update_task(&tasks, &id, |task| {
                            task.status = DownloadStatus::Cancelled;
                            task.message = Some("취소됨".to_string());
                        })
                        .map(|task| {
                            let _ = app.emit("download-error", task);
                        });
                    } else {
                        emit_terminal_error(&tasks, &app, &id, &e);
                    }
                }
            }
        });

        Ok(initial)
    }
}

fn update_task(
    tasks: &Arc<Mutex<HashMap<String, DownloadTask>>>,
    id: &str,
    mut f: impl FnMut(&mut DownloadTask),
) -> Result<DownloadTask, String> {
    let mut map = tasks
        .lock()
        .map_err(|_| "다운로드 큐 잠금에 실패했습니다.".to_string())?;
    let task = map
        .get_mut(id)
        .ok_or_else(|| "해당 다운로드를 찾을 수 없습니다.".to_string())?;
    f(task);
    task.updated_at = now_ts();
    Ok(task.clone())
}

fn emit_terminal_error(
    tasks: &Arc<Mutex<HashMap<String, DownloadTask>>>,
    app: &AppHandle,
    id: &str,
    message: &str,
) {
    let _ = update_task(tasks, id, |task| {
        task.status = DownloadStatus::Failed;
        task.message = Some(message.to_string());
    })
    .map(|task| {
        let _ = app.emit("download-error", task);
    });
}

fn is_cancelled(tasks: &Arc<Mutex<HashMap<String, DownloadTask>>>, id: &str) -> bool {
    tasks
        .lock()
        .ok()
        .and_then(|map| map.get(id).cloned())
        .map(|task| task.status == DownloadStatus::Cancelled)
        .unwrap_or(false)
}

fn now_ts() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn new_task_id(query: &str, now: i64) -> String {
    let seed = format!("{query}-{now}-{}", std::process::id());
    blake3::hash(seed.as_bytes()).to_hex().to_string()[..16].to_string()
}

/// Validates a yt-dlp output template so a download cannot escape its intended
/// base directory. The template must be a relative path without `..` segments.
fn validate_output_template(template: &str) -> Result<(), String> {
    let trimmed = template.trim();
    if trimmed.is_empty() {
        return Err("출력 형식을 입력하세요.".to_string());
    }

    let path = std::path::Path::new(trimmed);
    if path.is_absolute() {
        return Err("출력 형식은 상대 경로여야 합니다.".to_string());
    }

    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                return Err("출력 형식에 상위 경로(..)를 사용할 수 없습니다.".to_string());
            }
            std::path::Component::Prefix(_) | std::path::Component::RootDir => {
                return Err("출력 형식은 상대 경로여야 합니다.".to_string());
            }
            _ => {}
        }
    }

    Ok(())
}

/// Sends a terminate signal to a child process by pid, in a cross-platform way.
fn terminate_process(pid: u32) -> std::io::Result<std::process::ExitStatus> {
    #[cfg(unix)]
    {
        std::process::Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .status()
    }
    #[cfg(windows)]
    {
        std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .status()
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = pid;
        Err(std::io::Error::new(
            std::io::ErrorKind::Unsupported,
            "이 플랫폼에서는 프로세스 종료를 지원하지 않습니다.",
        ))
    }
}

fn settings_file_path() -> PathBuf {
    paths::data_dir().join("external_download_settings.json")
}

fn load_external_settings() -> Result<ExternalDownloadSettings, String> {
    let path = settings_file_path();
    if !path.exists() {
        return Ok(ExternalDownloadSettings::default());
    }

    let contents = std::fs::read_to_string(&path)
        .map_err(|e| format!("외부 다운로드 설정 읽기 실패 ({}): {e}", path.display()))?;
    serde_json::from_str::<ExternalDownloadSettings>(&contents)
        .map_err(|e| format!("외부 다운로드 설정 파싱 실패: {e}"))
}

fn save_external_settings(
    settings: &ExternalDownloadSettings,
) -> Result<ExternalDownloadSettings, String> {
    let mut normalized = settings.clone();
    normalized.download_dir = normalized.download_dir.trim().to_string();
    normalized.output_template = normalized.output_template.trim().to_string();

    if normalized.download_dir.is_empty() {
        return Err("저장 경로를 입력하세요.".to_string());
    }
    validate_output_template(&normalized.output_template)?;

    let base_dir = PathBuf::from(&normalized.download_dir);
    std::fs::create_dir_all(&base_dir)
        .map_err(|e| format!("저장 경로를 만들 수 없습니다 ({}): {e}", base_dir.display()))?;

    let path = settings_file_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("설정 디렉터리 생성 실패 ({}): {e}", parent.display()))?;
    }
    let json =
        serde_json::to_string_pretty(&normalized).map_err(|e| format!("설정 직렬화 실패: {e}"))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("외부 다운로드 설정 저장 실패 ({}): {e}", path.display()))?;

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_output_template_is_accepted() {
        let default = ExternalDownloadSettings::default();
        assert!(validate_output_template(&default.output_template).is_ok());
    }

    #[test]
    fn plain_relative_templates_are_accepted() {
        assert!(validate_output_template("%(title)s.%(ext)s").is_ok());
        assert!(validate_output_template("%(uploader)s/%(title)s.%(ext)s").is_ok());
    }

    /// Regression test for F-10: templates that could escape the base dir are
    /// rejected.
    #[test]
    fn traversal_and_absolute_templates_are_rejected() {
        assert!(validate_output_template("").is_err());
        assert!(validate_output_template("../%(title)s.%(ext)s").is_err());
        assert!(validate_output_template("a/../../%(title)s.%(ext)s").is_err());
        assert!(validate_output_template("/etc/%(title)s").is_err());
    }
}
