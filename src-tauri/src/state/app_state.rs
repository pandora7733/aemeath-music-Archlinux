use std::sync::RwLock;

use crate::infrastructure::audio::AudioPlayerHandle;
use crate::models::media_item::MediaItem;

pub struct AppState {
    pub library: RwLock<Vec<MediaItem>>,
    pub player: AudioPlayerHandle,
}

impl AppState {
    pub fn new(player: AudioPlayerHandle) -> Self {
        Self {
            library: RwLock::new(Vec::new()),
            player,
        }
    }
}
