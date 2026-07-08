use std::sync::Arc;

use crate::infrastructure::audio::AudioPlayerHandle;
use crate::infrastructure::db::Database;
use crate::services::download::DownloadService;
use crate::services::plugin_manager::PluginManager;

pub struct AppState {
    pub player: AudioPlayerHandle,
    pub db: Arc<Database>,
    pub plugins: PluginManager,
    pub downloads: DownloadService,
}

impl AppState {
    pub fn new(
        player: AudioPlayerHandle,
        db: Arc<Database>,
        plugins: PluginManager,
        downloads: DownloadService,
    ) -> Self {
        Self {
            player,
            db,
            plugins,
            downloads,
        }
    }
}
