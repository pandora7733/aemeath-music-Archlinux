use std::path::PathBuf;

use crate::infrastructure::scanner;
use crate::models::media_item::{MediaItem, MediaType};
use crate::state::AppState;

#[derive(Debug, Clone, Copy)]
pub enum LibraryKind {
    All,
    Audio,
    Video,
}

#[derive(Debug, Clone, Copy)]
pub enum LibrarySort {
    Title,
    Modified,
}

pub fn scan_library(state: &AppState, roots: Option<Vec<PathBuf>>) -> Result<usize, String> {
    let scan_roots = roots.unwrap_or_else(scanner::default_scan_roots);
    let mut collected = Vec::new();

    for root in scan_roots {
        let mut items = scanner::scan_directory(&root)?;
        collected.append(&mut items);
    }

    collected.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));

    let count = collected.len();
    let mut library = state
        .library
        .write()
        .map_err(|_| "라이브러리 상태 잠금에 실패했습니다.".to_string())?;
    *library = collected;

    Ok(count)
}

pub fn get_library_items(
    state: &AppState,
    kind: LibraryKind,
    sort: LibrarySort,
) -> Result<Vec<MediaItem>, String> {
    let library = state
        .library
        .read()
        .map_err(|_| "라이브러리 상태 잠금에 실패했습니다.".to_string())?;

    let mut items: Vec<MediaItem> = library
        .iter()
        .filter(|item| match kind {
            LibraryKind::All => true,
            LibraryKind::Audio => item.media_type == MediaType::Audio,
            LibraryKind::Video => item.media_type == MediaType::Video,
        })
        .cloned()
        .collect();

    match sort {
        LibrarySort::Title => {
            items.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
        }
        LibrarySort::Modified => {
            items.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
        }
    }

    Ok(items)
}
