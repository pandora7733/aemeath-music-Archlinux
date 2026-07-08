use std::path::PathBuf;

use crate::infrastructure::scanner;
use crate::models::media_item::MediaItem;
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

/// Scans the given roots (or defaults), extracts tags, and persists the result
/// to the database. Local tracks that no longer exist are pruned.
pub fn scan_library(state: &AppState, roots: Option<Vec<PathBuf>>) -> Result<usize, String> {
    let scan_roots = roots.unwrap_or_else(scanner::default_scan_roots);
    let mut collected = Vec::new();

    for root in scan_roots {
        let mut items = scanner::scan_directory(&root)?;
        collected.append(&mut items);
    }

    // Ordering is handled by SQL (`ORDER BY`) at query time, so we don't sort
    // here; persisting order has no effect on later reads.

    let existing_paths: Vec<String> = collected.iter().map(|item| item.path.clone()).collect();
    state.db.upsert_tracks(&collected)?;
    state.db.prune_missing_local(&existing_paths)?;

    Ok(collected.len())
}

pub fn get_library_items(
    state: &AppState,
    kind: LibraryKind,
    sort: LibrarySort,
) -> Result<Vec<MediaItem>, String> {
    state.db.list_tracks(kind, sort)
}
