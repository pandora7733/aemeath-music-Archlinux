use crate::models::discovery::DiscoveryTrack;
use crate::services::discovery;

#[tauri::command]
pub fn discovery_charts() -> Result<Vec<DiscoveryTrack>, String> {
    discovery::charts()
}

#[tauri::command]
pub fn discovery_releases() -> Result<Vec<DiscoveryTrack>, String> {
    discovery::releases()
}

#[tauri::command]
pub fn discovery_search(query: String) -> Result<Vec<DiscoveryTrack>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }
    discovery::search(&query)
}

/// Downloads a 30-second preview MP3 to the previews cache and returns the
/// local path so the existing audio engine can play it.
#[tauri::command]
pub fn discovery_fetch_preview(
    preview_url: String,
    external_id: String,
) -> Result<String, String> {
    discovery::fetch_preview(&preview_url, &external_id)
}
