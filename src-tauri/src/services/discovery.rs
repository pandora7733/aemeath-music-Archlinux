use std::io::Write;
use std::time::Duration;

use crate::infrastructure::discovery::{deezer, itunes};
use crate::infrastructure::network;
use crate::models::discovery::DiscoveryTrack;
use crate::services::paths;

pub fn charts() -> Result<Vec<DiscoveryTrack>, String> {
    deezer::chart()
}

pub fn releases() -> Result<Vec<DiscoveryTrack>, String> {
    deezer::releases()
}

/// Searches Deezer first, falling back to iTunes when Deezer yields nothing.
pub fn search(query: &str) -> Result<Vec<DiscoveryTrack>, String> {
    let deezer_results = deezer::search(query)?;
    if !deezer_results.is_empty() {
        return Ok(deezer_results);
    }
    itunes::search(query)
}

/// Downloads a preview MP3 to the previews cache dir, returning its local path.
/// Cached by external id so repeat plays don't re-download.
pub fn fetch_preview(preview_url: &str, external_id: &str) -> Result<String, String> {
    let previews = paths::previews_dir();
    std::fs::create_dir_all(&previews)
        .map_err(|e| format!("미리듣기 캐시 디렉터리 생성 실패: {e}"))?;

    let safe_id = external_id.replace(|c: char| !c.is_alphanumeric(), "_");
    let target = previews.join(format!("{safe_id}.mp3"));
    if target.exists() {
        return Ok(target.to_string_lossy().to_string());
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("미리듣기 클라이언트 생성 실패: {e}"))?;
    let bytes = client
        .get(preview_url)
        .send()
        .and_then(|r| r.error_for_status())
        .map_err(|e| {
            if network::is_reqwest_offline(&e) {
                network::offline_message("미리듣기 파일을 가져올 수 없습니다")
            } else {
                format!("미리듣기 요청 실패: {e}")
            }
        })?
        .bytes()
        .map_err(|e| {
            if network::is_reqwest_offline(&e) {
                network::offline_message("미리듣기 파일을 가져올 수 없습니다")
            } else {
                format!("미리듣기 응답 읽기 실패: {e}")
            }
        })?;

    let mut file =
        std::fs::File::create(&target).map_err(|e| format!("미리듣기 파일 생성 실패: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("미리듣기 파일 쓰기 실패: {e}"))?;

    Ok(target.to_string_lossy().to_string())
}
