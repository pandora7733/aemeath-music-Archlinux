use crate::infrastructure::audio::AudioPlayerHandle;
use crate::models::playback_state::PlaybackStateDto;

pub fn play(
    player: &AudioPlayerHandle,
    path: std::path::PathBuf,
) -> Result<PlaybackStateDto, String> {
    player.play(path)
}

pub fn toggle_pause(player: &AudioPlayerHandle) -> Result<PlaybackStateDto, String> {
    player.toggle_pause()
}

pub fn set_volume(player: &AudioPlayerHandle, volume: f32) -> Result<PlaybackStateDto, String> {
    player.set_volume(volume)
}

pub fn seek(
    player: &AudioPlayerHandle,
    position_secs: f64,
) -> Result<PlaybackStateDto, String> {
    player.seek(position_secs)
}

pub fn read_state(player: &AudioPlayerHandle) -> Result<PlaybackStateDto, String> {
    player.get_state()
}
