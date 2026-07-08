use std::path::PathBuf;

/// Returns `$HOME/Music` (e.g. `/home/sihoo/Music`).
pub fn music_dir() -> PathBuf {
    home_dir().join("Music")
}

/// Returns the app data dir (`~/.local/share/music-app`).
pub fn data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| home_dir().join(".local/share"))
        .join("music-app")
}

/// Returns the SQLite database path (`~/.local/share/music-app/db.sqlite`).
pub fn db_path() -> PathBuf {
    data_dir().join("db.sqlite")
}

/// Returns the album art cache dir (`~/.local/share/music-app/covers`).
pub fn covers_dir() -> PathBuf {
    data_dir().join("covers")
}

/// Returns the downloaded songs dir (`~/.local/share/music-app/songs`).
pub fn songs_dir() -> PathBuf {
    data_dir().join("songs")
}

/// Returns the plugin tools dir (`~/.local/share/music-app/tools`).
pub fn tools_dir() -> PathBuf {
    data_dir().join("tools")
}

/// Returns the online preview cache dir (`~/.local/share/music-app/previews`).
pub fn previews_dir() -> PathBuf {
    data_dir().join("previews")
}

/// Ensures all app directories exist. Called once at startup.
pub fn ensure_app_dirs() -> Result<(), String> {
    for dir in [data_dir(), covers_dir(), songs_dir(), tools_dir(), previews_dir()] {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("디렉터리를 생성할 수 없습니다 ({}): {e}", dir.display()))?;
    }
    Ok(())
}

fn home_dir() -> PathBuf {
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home);
    }

    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}
