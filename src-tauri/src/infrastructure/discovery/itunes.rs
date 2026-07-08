use serde::Deserialize;
use std::time::Duration;

use crate::infrastructure::network;
use crate::models::discovery::DiscoveryTrack;

const USER_AGENT: &str = "aemeath-music/0.1 (https://github.com/aemeath/aemeath-music)";

#[derive(Debug, Deserialize)]
struct ItunesResponse {
    #[serde(default)]
    results: Vec<ItunesTrack>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ItunesTrack {
    #[serde(default)]
    track_id: Option<i64>,
    #[serde(default)]
    track_name: Option<String>,
    #[serde(default)]
    artist_name: Option<String>,
    #[serde(default)]
    collection_name: Option<String>,
    #[serde(default)]
    artwork_url100: Option<String>,
    #[serde(default)]
    preview_url: Option<String>,
}

/// Searches the iTunes catalog. Used as a fallback when Deezer returns nothing.
pub fn search(query: &str) -> Result<Vec<DiscoveryTrack>, String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP 클라이언트 생성 실패: {e}"))?;

    let resp = client
        .get("https://itunes.apple.com/search")
        .query(&[
            ("term", query),
            ("media", "music"),
            ("entity", "song"),
            ("limit", "25"),
        ])
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|e| {
            if network::is_reqwest_offline(&e) {
                network::offline_message("외부 API에서 곡 정보를 가져올 수 없습니다")
            } else {
                format!("iTunes 검색 요청 실패: {e}")
            }
        })?;

    let parsed: ItunesResponse = resp
        .json()
        .map_err(|e| format!("iTunes 응답 파싱 실패: {e}"))?;

    let tracks = parsed
        .results
        .into_iter()
        .filter_map(|t| {
            let title = t.track_name?;
            let artist = t.artist_name.unwrap_or_else(|| "알 수 없는 아티스트".to_string());
            Some(DiscoveryTrack {
                title,
                artist,
                album: t.collection_name,
                cover_url: t.artwork_url100,
                preview_url: t.preview_url,
                source: "itunes".to_string(),
                external_id: t.track_id.map(|id| id.to_string()).unwrap_or_default(),
            })
        })
        .collect();

    Ok(tracks)
}
