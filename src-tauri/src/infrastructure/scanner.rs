use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

use crate::models::media_item::{MediaItem, MediaType};

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

fn media_item_from_path(path: &Path) -> Option<MediaItem> {
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

    Some(MediaItem {
        id: hash_path(&absolute_path),
        path: absolute_path,
        title: file_name,
        artist: None,
        album: None,
        duration_secs: None,
        media_type,
        extension,
        file_size: metadata.len(),
        modified_at,
    })
}

fn hash_path(path: &str) -> String {
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

pub fn default_scan_roots() -> Vec<PathBuf> {
    vec![crate::services::paths::music_dir()]
}
