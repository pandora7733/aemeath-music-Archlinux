use tauri::{AppHandle, State};

use crate::models::download_task::DownloadTask;
use crate::services::download::ExternalDownloadSettings;
use crate::state::AppState;

/// Downloads a track by "artist - title" query using the installed yt-dlp
/// plugin. Returns immediately; progress arrives via events.
#[tauri::command]
pub fn download_track(
    app: AppHandle,
    state: State<'_, AppState>,
    query: String,
) -> Result<DownloadTask, String> {
    if query.trim().is_empty() {
        return Err("다운로드할 곡 정보를 입력하세요.".to_string());
    }
    let db = state.inner().db.clone();
    state.inner().downloads.enqueue(db, app, query)
}

/// Downloads from an external URL using mp3 conversion + metadata/thumbnail
/// embedding preset.
#[tauri::command]
pub fn download_external_url(
    app: AppHandle,
    state: State<'_, AppState>,
    url: String,
) -> Result<DownloadTask, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("다운로드할 URL을 입력하세요.".to_string());
    }
    let db = state.inner().db.clone();
    state
        .inner()
        .downloads
        .enqueue_external_url(db, app, trimmed.to_string())
}

#[tauri::command]
pub fn download_list(state: State<'_, AppState>) -> Result<Vec<DownloadTask>, String> {
    state.inner().downloads.list()
}

#[tauri::command]
pub fn download_cancel(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.inner().downloads.cancel(&id)
}

#[tauri::command]
pub fn external_download_settings_get(
    state: State<'_, AppState>,
) -> Result<ExternalDownloadSettings, String> {
    state.inner().downloads.get_external_settings()
}

#[tauri::command]
pub fn external_download_settings_update(
    state: State<'_, AppState>,
    settings: ExternalDownloadSettings,
) -> Result<ExternalDownloadSettings, String> {
    state.inner().downloads.update_external_settings(settings)
}

#[tauri::command]
pub fn external_download_settings_reset(
    state: State<'_, AppState>,
) -> Result<ExternalDownloadSettings, String> {
    state.inner().downloads.reset_external_settings()
}
