use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Audio,
    Video,
}

impl MediaType {
    pub fn as_str(&self) -> &'static str {
        match self {
            MediaType::Audio => "audio",
            MediaType::Video => "video",
        }
    }

    pub fn from_str(value: &str) -> Self {
        match value {
            "video" => MediaType::Video,
            _ => MediaType::Audio,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MediaSource {
    Local,
    Downloaded,
}

impl MediaSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            MediaSource::Local => "local",
            MediaSource::Downloaded => "downloaded",
        }
    }

    pub fn from_str(value: &str) -> Self {
        match value {
            "downloaded" => MediaSource::Downloaded,
            _ => MediaSource::Local,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaItem {
    pub id: String,
    pub path: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_secs: Option<u32>,
    pub media_type: MediaType,
    pub extension: String,
    pub file_size: u64,
    pub modified_at: i64,
    pub cover_path: Option<String>,
    pub added_at: i64,
    pub source: MediaSource,
}
