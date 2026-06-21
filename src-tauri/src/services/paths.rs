use std::path::PathBuf;

/// Returns `$HOME/Music` (e.g. `/home/sihoo/Music`).
pub fn music_dir() -> PathBuf {
    home_dir().join("Music")
}

fn home_dir() -> PathBuf {
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home);
    }

    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}
