use tauri::State;

use crate::models::playlist::{Playlist, PlaylistDetail};
use crate::services::playlist;
use crate::state::AppState;

#[tauri::command]
pub fn playlist_create(state: State<'_, AppState>, name: String) -> Result<Playlist, String> {
    playlist::create(&state.inner().db, &name)
}

#[tauri::command]
pub fn playlist_rename(
    state: State<'_, AppState>,
    id: String,
    name: String,
) -> Result<(), String> {
    playlist::rename(&state.inner().db, &id, &name)
}

#[tauri::command]
pub fn playlist_delete(state: State<'_, AppState>, id: String) -> Result<(), String> {
    playlist::delete(&state.inner().db, &id)
}

#[tauri::command]
pub fn playlist_list(state: State<'_, AppState>) -> Result<Vec<Playlist>, String> {
    playlist::list(&state.inner().db)
}

#[tauri::command]
pub fn playlist_get(state: State<'_, AppState>, id: String) -> Result<PlaylistDetail, String> {
    playlist::get(&state.inner().db, &id)
}

#[tauri::command]
pub fn playlist_add_track(
    state: State<'_, AppState>,
    playlist_id: String,
    track_id: String,
) -> Result<(), String> {
    playlist::add_track(&state.inner().db, &playlist_id, &track_id)
}

#[tauri::command]
pub fn playlist_remove_track(
    state: State<'_, AppState>,
    playlist_id: String,
    track_id: String,
) -> Result<(), String> {
    playlist::remove_track(&state.inner().db, &playlist_id, &track_id)
}

#[tauri::command]
pub fn playlist_reorder(
    state: State<'_, AppState>,
    playlist_id: String,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    playlist::reorder(&state.inner().db, &playlist_id, &ordered_ids)
}
