use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::models::media_item::MediaItem;
use crate::services::library::{self, LibraryKind, LibrarySort};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanLibraryParams {
    pub roots: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanLibraryResult {
    pub scanned: usize,
    pub root: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetLibraryItemsParams {
    pub kind: Option<String>,
    pub sort: Option<String>,
}

#[tauri::command]
pub fn scan_library(
    state: State<'_, AppState>,
    params: Option<ScanLibraryParams>,
) -> Result<ScanLibraryResult, String> {
    let roots = params.and_then(|p| p.roots).map(|paths| {
        paths.into_iter().map(PathBuf::from).collect::<Vec<_>>()
    });

    let scanned = library::scan_library(state.inner(), roots)?;
    let root = crate::services::paths::music_dir().to_string_lossy().to_string();

    Ok(ScanLibraryResult { scanned, root })
}

#[tauri::command]
pub fn get_library_items(
    state: State<'_, AppState>,
    params: Option<GetLibraryItemsParams>,
) -> Result<Vec<MediaItem>, String> {
    let params = params.unwrap_or(GetLibraryItemsParams {
        kind: None,
        sort: None,
    });

    let kind = match params.kind.as_deref() {
        Some("audio") => LibraryKind::Audio,
        Some("video") => LibraryKind::Video,
        _ => LibraryKind::All,
    };

    let sort = match params.sort.as_deref() {
        Some("modified") => LibrarySort::Modified,
        _ => LibrarySort::Title,
    };

    library::get_library_items(state.inner(), kind, sort)
}
