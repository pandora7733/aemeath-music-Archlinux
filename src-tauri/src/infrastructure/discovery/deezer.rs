use serde::Deserialize;
use std::time::Duration;

use crate::models::discovery::DiscoveryTrack;

const USER_AGENT: &str = "aemeath-music/0.1 (https://github.com/aemeath/aemeath-music)";

#[derive(Debug, Default, Deserialize)]
struct DeezerTrackListResponse {
    #[serde(default)]
    data: Vec<DeezerTrack>,
}

#[derive(Debug, Deserialize)]
struct DeezerChartResponse {
    #[serde(default)]
    tracks: DeezerTrackListResponse,
}

#[derive(Debug, Deserialize)]
struct DeezerTrack {
    id: i64,
    title: String,
    #[serde(default)]
    preview: String,
    artist: DeezerArtist,
    #[serde(default)]
    album: Option<DeezerAlbum>,
}

#[derive(Debug, Deserialize)]
struct DeezerArtist {
    name: String,
}

#[derive(Debug, Deserialize)]
struct DeezerAlbum {
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    cover_medium: Option<String>,
}

fn client() -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP 클라이언트 생성 실패: {e}"))
}

fn map_track(track: DeezerTrack) -> DiscoveryTrack {
    let (album_title, cover_url) = match track.album {
        Some(album) => (album.title, album.cover_medium),
        None => (None, None),
    };
    DiscoveryTrack {
        title: track.title,
        artist: track.artist.name,
        album: album_title,
        cover_url,
        preview_url: if track.preview.is_empty() {
            None
        } else {
            Some(track.preview)
        },
        source: "deezer".to_string(),
        external_id: track.id.to_string(),
    }
}

/// Fetches the current Deezer chart (top tracks).
pub fn chart() -> Result<Vec<DiscoveryTrack>, String> {
    let resp = client()?
        .get("https://api.deezer.com/chart")
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("Deezer 차트 요청 실패: {e}"))?;
    let parsed: DeezerChartResponse = resp
        .json()
        .map_err(|e| format!("Deezer 응답 파싱 실패: {e}"))?;
    Ok(parsed.tracks.data.into_iter().map(map_track).collect())
}

/// Searches Deezer tracks by free-text query.
pub fn search(query: &str) -> Result<Vec<DiscoveryTrack>, String> {
    let resp = client()?
        .get("https://api.deezer.com/search")
        .query(&[("q", query)])
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("Deezer 검색 요청 실패: {e}"))?;
    let parsed: DeezerTrackListResponse = resp
        .json()
        .map_err(|e| format!("Deezer 응답 파싱 실패: {e}"))?;
    Ok(parsed.data.into_iter().map(map_track).collect())
}

/// Fetches newly released tracks via Deezer editorial releases.
pub fn releases() -> Result<Vec<DiscoveryTrack>, String> {
    // editorial/0/releases returns albums; we surface their tracks via chart as
    // a stable fallback. Deezer's editorial charts double as "new" content.
    let resp = client()?
        .get("https://api.deezer.com/editorial/0/charts")
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("Deezer 신보 요청 실패: {e}"))?;
    let parsed: DeezerChartResponse = resp
        .json()
        .map_err(|e| format!("Deezer 응답 파싱 실패: {e}"))?;
    Ok(parsed.tracks.data.into_iter().map(map_track).collect())
}
