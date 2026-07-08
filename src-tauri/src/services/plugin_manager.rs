use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::infrastructure::plugins::ytdlp;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginStatus {
    pub id: String,
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallProgress {
    plugin: String,
    progress: f64,
}

#[derive(Clone)]
pub struct PluginManager {
    app: AppHandle,
}

impl PluginManager {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    pub fn status(&self) -> PluginStatus {
        PluginStatus {
            id: "yt-dlp".to_string(),
            name: "yt-dlp".to_string(),
            installed: ytdlp::is_installed(),
            version: ytdlp::installed_version(),
        }
    }

    /// Installs yt-dlp, emitting `plugin-install-progress` events. Runs
    /// synchronously on a background thread spawned by the caller/command.
    pub fn install(&self) -> Result<PluginStatus, String> {
        let app = self.app.clone();
        ytdlp::install(|progress| {
            let _ = app.emit(
                "plugin-install-progress",
                InstallProgress {
                    plugin: "yt-dlp".to_string(),
                    progress,
                },
            );
        })?;
        Ok(self.status())
    }

    /// Uninstalls yt-dlp by deleting the local runtime-downloaded binary.
    pub fn uninstall(&self) -> Result<PluginStatus, String> {
        ytdlp::uninstall()?;
        Ok(self.status())
    }
}
