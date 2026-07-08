use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use crate::infrastructure::network;
use crate::services::paths;

const YTDLP_RELEASE_URL: &str =
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
const USER_AGENT: &str = "aemeath-music/0.1 (https://github.com/aemeath/aemeath-music)";

fn map_install_request_error(err: reqwest::Error) -> String {
    if network::is_reqwest_offline(&err) {
        return network::offline_message("yt-dlp 플러그인을 다운로드할 수 없습니다");
    }
    format!("yt-dlp 다운로드 요청 실패: {err}")
}

fn map_stream_read_error(err: std::io::Error) -> String {
    let text = err.to_string();
    if network::is_network_error_text(&text) {
        return network::offline_message("yt-dlp 플러그인을 다운로드할 수 없습니다");
    }
    format!("다운로드 스트림 읽기 실패: {err}")
}

fn map_download_failure(stderr: &str) -> String {
    if network::is_network_error_text(stderr) {
        return network::offline_message("yt-dlp로 곡을 다운로드할 수 없습니다");
    }
    format!("yt-dlp 다운로드 실패: {stderr}")
}

/// Absolute path where the yt-dlp binary is (or will be) installed.
pub fn binary_path() -> PathBuf {
    paths::tools_dir().join("yt-dlp")
}

pub fn is_installed() -> bool {
    binary_path().exists()
}

/// Removes the installed yt-dlp binary from the tools directory.
pub fn uninstall() -> Result<(), String> {
    let path = binary_path();
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| {
            format!(
                "yt-dlp 바이너리를 삭제할 수 없습니다 ({}): {e}",
                path.display()
            )
        })?;
    }

    let part = path.with_extension("part");
    if part.exists() {
        std::fs::remove_file(&part).map_err(|e| {
            format!(
                "yt-dlp 임시 파일을 삭제할 수 없습니다 ({}): {e}",
                part.display()
            )
        })?;
    }

    Ok(())
}

/// Runs `yt-dlp --version` and returns the reported version, if installed.
pub fn installed_version() -> Option<String> {
    if !is_installed() {
        return None;
    }
    let output = Command::new(binary_path()).arg("--version").output().ok()?;
    if !output.status.success() {
        return None;
    }
    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if version.is_empty() {
        None
    } else {
        Some(version)
    }
}

/// Downloads the yt-dlp binary from the official GitHub release into the tools
/// dir and marks it executable. `on_progress` receives a 0.0..=1.0 fraction.
pub fn install(mut on_progress: impl FnMut(f64)) -> Result<(), String> {
    let tools = paths::tools_dir();
    std::fs::create_dir_all(&tools)
        .map_err(|e| format!("도구 디렉터리를 생성할 수 없습니다: {e}"))?;

    let client = reqwest::blocking::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("HTTP 클라이언트 생성 실패: {e}"))?;

    let mut response = client
        .get(YTDLP_RELEASE_URL)
        .send()
        .map_err(map_install_request_error)?;

    if !response.status().is_success() {
        return Err(format!("yt-dlp 다운로드 실패: HTTP {}", response.status()));
    }

    let total = response.content_length().unwrap_or(0);
    let target = binary_path();
    let tmp = target.with_extension("part");
    let mut file =
        std::fs::File::create(&tmp).map_err(|e| format!("임시 파일 생성 실패: {e}"))?;

    let mut downloaded: u64 = 0;
    let mut buffer = [0u8; 16384];
    loop {
        let read = response
            .read(&mut buffer)
            .map_err(map_stream_read_error)?;
        if read == 0 {
            break;
        }
        file.write_all(&buffer[..read])
            .map_err(|e| format!("파일 쓰기 실패: {e}"))?;
        downloaded += read as u64;
        if total > 0 {
            on_progress(downloaded as f64 / total as f64);
        }
    }
    file.flush().map_err(|e| format!("파일 flush 실패: {e}"))?;
    drop(file);

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&tmp)
            .map_err(|e| format!("권한 조회 실패: {e}"))?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&tmp, perms)
            .map_err(|e| format!("실행 권한 설정 실패: {e}"))?;
    }

    std::fs::rename(&tmp, &target).map_err(|e| format!("설치 완료 처리 실패: {e}"))?;
    on_progress(1.0);
    Ok(())
}

/// Downloads the best audio for a search query into `out_dir`, returning the
/// final saved file path. Exposes the spawned process pid so callers can
/// support cancellation.
pub fn download_audio_with_pid(
    query: &str,
    out_dir: &std::path::Path,
    on_pid: impl FnOnce(u32),
) -> Result<PathBuf, String> {
    if !is_installed() {
        return Err("yt-dlp가 설치되지 않았습니다.".to_string());
    }
    std::fs::create_dir_all(out_dir)
        .map_err(|e| format!("저장 디렉터리를 생성할 수 없습니다: {e}"))?;

    let output_template = out_dir.join("%(id)s.%(ext)s");
    let child = Command::new(binary_path())
        .args([
            &format!("ytsearch1:{query}"),
            "-f",
            "bestaudio",
            "-x",
            "--audio-format",
            "opus",
            "--no-playlist",
            "--no-simulate",
            "--print",
            "after_move:filepath",
            "-o",
            &output_template.to_string_lossy(),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("yt-dlp 실행 실패: {e}"))?;
    on_pid(child.id());

    let output = child
        .wait_with_output()
        .map_err(|e| format!("yt-dlp 실행 결과를 읽을 수 없습니다: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(map_download_failure(&stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let filepath = stdout
        .lines()
        .last()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "다운로드된 파일 경로를 확인할 수 없습니다.".to_string())?;

    Ok(PathBuf::from(filepath))
}

/// Downloads audio from a direct external URL with metadata/thumbnails and
/// converts it to mp3, returning the final saved file path. Exposes spawned
/// process pid so callers can support cancellation.
pub fn download_from_url_as_mp3_with_pid(
    url: &str,
    output_template: &str,
    on_pid: impl FnOnce(u32),
) -> Result<PathBuf, String> {
    if !is_installed() {
        return Err("yt-dlp가 설치되지 않았습니다.".to_string());
    }
    let child = Command::new(binary_path())
        .args([
            "-x",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "--add-metadata",
            "--embed-thumbnail",
            "--embed-chapters",
            "--write-info-json",
            "--write-thumbnail",
            "--convert-thumbnails",
            "jpg",
            "--print",
            "after_move:filepath",
            "-o",
            output_template,
            url,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("yt-dlp 실행 실패: {e}"))?;
    on_pid(child.id());

    let output = child
        .wait_with_output()
        .map_err(|e| format!("yt-dlp 실행 결과를 읽을 수 없습니다: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(map_download_failure(&stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let filepath = stdout
        .lines()
        .last()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "다운로드된 파일 경로를 확인할 수 없습니다.".to_string())?;

    Ok(PathBuf::from(filepath))
}
