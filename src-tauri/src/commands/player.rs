use tauri::State;

use crate::models::playback_state::PlaybackStateDto;
use crate::services::player as player_service;
use crate::state::AppState;

#[tauri::command]
pub fn player_play(state: State<'_, AppState>, path: String) -> Result<PlaybackStateDto, String> {
    player_service::play(&state.inner().player, std::path::PathBuf::from(path))
}

#[tauri::command]
pub fn player_toggle_pause(state: State<'_, AppState>) -> Result<PlaybackStateDto, String> {
    player_service::toggle_pause(&state.inner().player)
}

#[tauri::command]
pub fn player_set_volume(
    state: State<'_, AppState>,
    volume: f32,
) -> Result<PlaybackStateDto, String> {
    player_service::set_volume(&state.inner().player, volume)
}

#[tauri::command]
pub fn player_seek(
    state: State<'_, AppState>,
    position_secs: f64,
) -> Result<PlaybackStateDto, String> {
    player_service::seek(&state.inner().player, position_secs)
}

#[tauri::command]
pub fn player_get_state(state: State<'_, AppState>) -> Result<PlaybackStateDto, String> {
    player_service::read_state(&state.inner().player)
}
