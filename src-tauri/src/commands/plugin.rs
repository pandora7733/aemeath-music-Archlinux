use tauri::{Emitter, State};

use crate::services::plugin_manager::PluginStatus;
use crate::state::AppState;

#[tauri::command(async)]
pub fn plugin_status(state: State<'_, AppState>) -> Result<PluginStatus, String> {
    Ok(state.inner().plugins.status())
}

/// Installs (or reinstalls/updates) yt-dlp. Runs on a blocking-friendly thread
/// so the UI stays responsive; progress is reported via events.
#[tauri::command]
pub fn plugin_install(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<PluginStatus, String> {
    spawn_install(app, state.inner().plugins.clone());
    Ok(state.inner().plugins.status())
}

/// Re-downloads the latest yt-dlp; identical to install but named for clarity.
#[tauri::command]
pub fn plugin_update(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<PluginStatus, String> {
    spawn_install(app, state.inner().plugins.clone());
    Ok(state.inner().plugins.status())
}

#[tauri::command(async)]
pub fn plugin_uninstall(state: State<'_, AppState>) -> Result<PluginStatus, String> {
    state.inner().plugins.uninstall()
}

fn spawn_install(app: tauri::AppHandle, manager: crate::services::plugin_manager::PluginManager) {
    std::thread::spawn(move || {
        if let Err(message) = manager.install() {
            let _ = app.emit("plugin-install-error", message);
        }
    });
}
