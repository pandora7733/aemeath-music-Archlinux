use std::sync::RwLock;

use crate::models::media_item::MediaItem;

pub struct AppState {
    pub library: RwLock<Vec<MediaItem>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            library: RwLock::new(Vec::new()),
        }
    }
}
