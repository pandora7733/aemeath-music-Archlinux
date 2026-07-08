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
    collect_files(root, &mut items);
    Ok(items)
}

/// Recursively collects media files. Individual directories or entries that
/// cannot be read (permission errors, broken symlinks, etc.) are logged and
/// skipped so that one unreadable path never aborts the whole library scan.
fn collect_files(current: &Path, items: &mut Vec<MediaItem>) {
    let entries = match fs::read_dir(current) {
        Ok(entries) => entries,
        Err(e) => {
            eprintln!(
                "[scanner] 디렉터리를 건너뜁니다 ({}): {e}",
                current.display()
            );
            return;
        }
    };

    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(e) => {
                eprintln!("[scanner] 항목을 건너뜁니다 ({}): {e}", current.display());
                continue;
            }
        };
        let path = entry.path();

        if path.is_dir() {
            collect_files(&path, items);
            continue;
        }

        if let Some(item) = media_item_from_path(&path) {
            items.push(item);
        }
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    fn unique_temp_dir(tag: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir()
            .join(format!("aemeath_scan_{tag}_{}_{nanos}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn scan_collects_nested_audio_and_skips_non_media() {
        let root = unique_temp_dir("nested");
        fs::write(root.join("a.mp3"), b"not really audio").unwrap();
        let sub = root.join("sub");
        fs::create_dir_all(&sub).unwrap();
        fs::write(sub.join("b.flac"), b"not really audio").unwrap();
        fs::write(root.join("ignore.txt"), b"text").unwrap();

        let items = scan_directory(&root).unwrap();
        let titles: Vec<String> = items.iter().map(|i| i.title.clone()).collect();

        assert_eq!(items.len(), 2, "expected 2 media files, got {titles:?}");
        assert!(titles.contains(&"a".to_string()));
        assert!(titles.contains(&"b".to_string()));

        let _ = fs::remove_dir_all(&root);
    }

    /// Regression test for F-05: an unreadable subdirectory must be skipped
    /// rather than aborting the entire scan.
    #[cfg(unix)]
    #[test]
    fn scan_skips_unreadable_subdirectory() {
        use std::os::unix::fs::PermissionsExt;

        let root = unique_temp_dir("perm");
        fs::write(root.join("ok.mp3"), b"x").unwrap();
        let locked = root.join("locked");
        fs::create_dir_all(&locked).unwrap();
        fs::set_permissions(&locked, fs::Permissions::from_mode(0o000)).unwrap();

        let result = scan_directory(&root);

        // Restore permissions so cleanup can proceed regardless of the outcome.
        let _ = fs::set_permissions(&locked, fs::Permissions::from_mode(0o755));

        let items = result.expect("scan should not fail on an unreadable subdir");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].title, "ok");

        let _ = fs::remove_dir_all(&root);
    }
}
