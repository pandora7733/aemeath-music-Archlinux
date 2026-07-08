use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlbumGroup {
    pub album: String,
    pub artist: String,
    pub track_count: u32,
    pub cover_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistGroup {
    pub artist: String,
    pub track_count: u32,
    pub album_count: u32,
}
