use serde::{Deserialize, Serialize};

/// A track discovered from an online source (Deezer/iTunes). Not downloaded.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryTrack {
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub cover_url: Option<String>,
    /// 30-second preview MP3 URL, playable without downloading.
    pub preview_url: Option<String>,
    pub source: String,
    pub external_id: String,
}
