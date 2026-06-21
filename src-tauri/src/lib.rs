mod commands;
mod infrastructure;
mod models;
mod services;
mod state;

use tauri::Manager;

use infrastructure::audio::create_audio_player;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let player = create_audio_player(app.handle().clone())?;
            app.manage(AppState::new(player));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_library,
            commands::library::get_library_items,
            commands::player::player_play,
            commands::player::player_toggle_pause,
            commands::player::player_set_volume,
            commands::player::player_seek,
            commands::player::player_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
