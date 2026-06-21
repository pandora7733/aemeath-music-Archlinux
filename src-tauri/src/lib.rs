mod commands;
mod infrastructure;
mod models;
mod services;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::library::scan_library,
            commands::library::get_library_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
