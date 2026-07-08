use tauri::State;

use crate::models::media_item::MediaItem;
use crate::services::favorites;
use crate::state::AppState;

#[tauri::command]
pub fn favorite_toggle(state: State<'_, AppState>, track_id: String) -> Result<bool, String> {
    favorites::toggle(&state.inner().db, &track_id)
}

#[tauri::command]
pub fn favorite_ids(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    favorites::list_ids(&state.inner().db)
}

#[tauri::command]
pub fn favorite_list(state: State<'_, AppState>) -> Result<Vec<MediaItem>, String> {
    favorites::list_tracks(&state.inner().db)
}
