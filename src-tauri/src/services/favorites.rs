use crate::infrastructure::db::Database;
use crate::models::media_item::MediaItem;

pub fn toggle(db: &Database, track_id: &str) -> Result<bool, String> {
    db.favorite_toggle(track_id)
}

pub fn list_ids(db: &Database) -> Result<Vec<String>, String> {
    db.favorite_ids()
}

pub fn list_tracks(db: &Database) -> Result<Vec<MediaItem>, String> {
    db.favorite_tracks()
}
