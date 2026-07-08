use crate::infrastructure::db::Database;
use crate::models::playlist::{Playlist, PlaylistDetail};

pub fn create(db: &Database, name: &str) -> Result<Playlist, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("플레이리스트 이름을 입력하세요.".to_string());
    }
    db.playlist_create(trimmed)
}

pub fn rename(db: &Database, id: &str, name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("플레이리스트 이름을 입력하세요.".to_string());
    }
    db.playlist_rename(id, trimmed)
}

pub fn delete(db: &Database, id: &str) -> Result<(), String> {
    db.playlist_delete(id)
}

pub fn list(db: &Database) -> Result<Vec<Playlist>, String> {
    db.playlist_list()
}

pub fn get(db: &Database, id: &str) -> Result<PlaylistDetail, String> {
    db.playlist_get(id)
}

pub fn add_track(db: &Database, playlist_id: &str, track_id: &str) -> Result<(), String> {
    db.playlist_add_track(playlist_id, track_id)
}

pub fn remove_track(db: &Database, playlist_id: &str, track_id: &str) -> Result<(), String> {
    db.playlist_remove_track(playlist_id, track_id)
}

pub fn reorder(db: &Database, playlist_id: &str, ordered_ids: &[String]) -> Result<(), String> {
    db.playlist_reorder(playlist_id, ordered_ids)
}
