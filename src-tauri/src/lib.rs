mod commands;
mod infrastructure;
mod models;
mod services;
mod state;

use std::sync::Arc;

use tauri::Manager;

use infrastructure::audio::create_audio_player;
use infrastructure::db::Database;
use services::download::DownloadService;
use services::paths;
use services::plugin_manager::PluginManager;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            paths::ensure_app_dirs()?;
            let player = create_audio_player(app.handle().clone())?;
            let db = Arc::new(Database::connect(&paths::db_path())?);
            let plugins = PluginManager::new(app.handle().clone());
            let downloads = DownloadService::new();
            app.manage(AppState::new(player, db, plugins, downloads));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_library,
            commands::library::get_library_items,
            commands::library::get_recently_added,
            commands::library::get_albums,
            commands::library::get_album_tracks,
            commands::library::get_artists,
            commands::library::get_artist_tracks,
            commands::library::get_music_root,
            commands::favorites::favorite_toggle,
            commands::favorites::favorite_ids,
            commands::favorites::favorite_list,
            commands::playlist::playlist_create,
            commands::playlist::playlist_rename,
            commands::playlist::playlist_delete,
            commands::playlist::playlist_list,
            commands::playlist::playlist_get,
            commands::playlist::playlist_add_track,
            commands::playlist::playlist_remove_track,
            commands::playlist::playlist_reorder,
            commands::discovery::discovery_charts,
            commands::discovery::discovery_releases,
            commands::discovery::discovery_search,
            commands::discovery::discovery_fetch_preview,
            commands::plugin::plugin_status,
            commands::plugin::plugin_install,
            commands::plugin::plugin_update,
            commands::plugin::plugin_uninstall,
            commands::download::download_track,
            commands::download::download_external_url,
            commands::download::download_list,
            commands::download::download_cancel,
            commands::download::external_download_settings_get,
            commands::download::external_download_settings_update,
            commands::download::external_download_settings_reset,
            commands::player::player_play,
            commands::player::player_toggle_pause,
            commands::player::player_set_volume,
            commands::player::player_seek,
            commands::player::player_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
