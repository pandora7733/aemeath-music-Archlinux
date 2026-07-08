use std::fs;
use std::path::{Path, PathBuf};

use crate::infrastructure::tags::read_tags;
use crate::models::media_item::{MediaItem, MediaSource, MediaType};
use crate::services::paths;

const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "flac", "wav", "m4a", "ogg", "opus", "aac", "wma", "aiff", "alac", "webm",
];

const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mkv", "avi", "mov", "wmv", "m4v"];

pub fn scan_directory(root: &Path) -> Result<Vec<MediaItem>, String> {
    if !root.exists() {
        return Ok(Vec::new());
    }

    if !root.is_dir() {
        return Err(format!("스캔 경로가 디렉터리가 아닙니다: {}", root.display()));
    }

    let mut items = Vec::new();
    collect_files(root, &mut items)?;
    Ok(items)
}

fn collect_files(current: &Path, items: &mut Vec<MediaItem>) -> Result<(), String> {
    let entries = fs::read_dir(current).map_err(|e| {
        format!(
            "디렉터리를 읽을 수 없습니다 ({}): {e}",
            current.display()
        )
    })?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            collect_files(&path, items)?;
            continue;
        }

        if let Some(item) = media_item_from_path(&path) {
            items.push(item);
        }
    }

    Ok(())
}

/// Builds a `MediaItem` from a file path, reading embedded tags for audio files
/// and extracting cover art into the covers cache directory.
pub fn media_item_from_path(path: &Path) -> Option<MediaItem> {
    let extension = path.extension()?.to_str()?.to_ascii_lowercase();
    let media_type = if AUDIO_EXTENSIONS.contains(&extension.as_str()) {
        MediaType::Audio
    } else if VIDEO_EXTENSIONS.contains(&extension.as_str()) {
        MediaType::Video
    } else {
        return None;
    };

    let metadata = fs::metadata(path).ok()?;
    let file_name = path.file_stem()?.to_string_lossy().to_string();
    let absolute_path = fs::canonicalize(path)
        .unwrap_or_else(|_| path.to_path_buf())
        .to_string_lossy()
        .to_string();

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0);

    let id = hash_path(&absolute_path);

    let mut title = file_name;
    let mut artist = None;
    let mut album = None;
    let mut duration_secs = None;
    let mut cover_path = None;

    if media_type == MediaType::Audio {
        let tags = read_tags(path);
        if let Some(tag_title) = tags.title {
            title = tag_title;
        }
        artist = tags.artist;
        album = tags.album;
        duration_secs = tags.duration_secs;

        if let Some(cover_bytes) = tags.cover_art {
            cover_path = save_cover_art(&id, &cover_bytes);
        }
    }

    Some(MediaItem {
        id,
        path: absolute_path,
        title,
        artist,
        album,
        duration_secs,
        media_type,
        extension,
        file_size: metadata.len(),
        modified_at,
        cover_path,
        added_at: 0,
        source: MediaSource::Local,
    })
}

/// Saves embedded cover art to the covers cache dir. Returns the saved path.
fn save_cover_art(track_id: &str, bytes: &[u8]) -> Option<String> {
    let covers = paths::covers_dir();
    fs::create_dir_all(&covers).ok()?;
    let target = covers.join(format!("{track_id}.jpg"));
    if !target.exists() {
        fs::write(&target, bytes).ok()?;
    }
    Some(target.to_string_lossy().to_string())
}

pub fn hash_path(path: &str) -> String {
    blake3::hash(path.as_bytes()).to_hex().to_string()
}

pub fn default_scan_roots() -> Vec<PathBuf> {
    vec![crate::services::paths::music_dir()]
}
