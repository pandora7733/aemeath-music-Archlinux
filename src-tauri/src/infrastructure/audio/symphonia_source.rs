use std::fs::File;
use std::path::Path;
use std::time::Duration;

use rodio::Source;
use symphonia::core::audio::{SampleBuffer, SignalSpec};
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error;
use symphonia::core::formats::{FormatOptions, SeekMode, SeekTo};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use symphonia::core::units::Time;
use symphonia::default::{get_codecs, get_probe};

pub struct SymphoniaSource {
    format: Box<dyn symphonia::core::formats::FormatReader>,
    track_id: u32,
    decoder: Box<dyn symphonia::core::codecs::Decoder>,
    sample_rate: u32,
    channels: u16,
    duration_secs: f64,
    sample_buf: SampleBuffer<f32>,
    pending: Vec<f32>,
    pending_idx: usize,
    ended: bool,
}

impl SymphoniaSource {
    pub fn open(path: &Path, position_secs: f64) -> Result<Self, String> {
        let src = File::open(path).map_err(|e| format!("파일을 열 수 없습니다: {e}"))?;
        let mss = MediaSourceStream::new(Box::new(src), Default::default());

        let mut hint = Hint::new();
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            hint.with_extension(ext);
        }

        let probed = get_probe()
            .format(
                &hint,
                mss,
                &FormatOptions::default(),
                &MetadataOptions::default(),
            )
            .map_err(|e| format!("오디오 포맷을 분석할 수 없습니다: {e}"))?;

        let format = probed.format;

        let track = format
            .tracks()
            .iter()
            .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
            .ok_or_else(|| "오디오 트랙을 찾을 수 없습니다.".to_string())?;

        let track_id = track.id;
        let codec_params = track.codec_params.clone();

        let sample_rate = codec_params.sample_rate.unwrap_or(44_100);
        let channels = codec_params
            .channels
            .map(|c| c.count() as u16)
            .unwrap_or(2);

        let duration_secs = codec_params
            .n_frames
            .zip(codec_params.sample_rate)
            .map(|(frames, rate)| frames as f64 / rate as f64)
            .unwrap_or(0.0);

        let decoder = get_codecs()
            .make(&codec_params, &DecoderOptions::default())
            .map_err(|e| format!("디코더를 생성할 수 없습니다: {e}"))?;

        let spec = SignalSpec::new(sample_rate, codec_params.channels.unwrap_or_default());
        let sample_buf = SampleBuffer::<f32>::new(0, spec);

        let mut source = Self {
            format,
            track_id,
            decoder,
            sample_rate,
            channels,
            duration_secs,
            sample_buf,
            pending: Vec::new(),
            pending_idx: 0,
            ended: false,
        };

        if position_secs > 0.0 {
            source.seek_internal(position_secs)?;
        }

        Ok(source)
    }

    fn seek_internal(&mut self, position_secs: f64) -> Result<(), String> {
        let position_secs = if self.duration_secs > 0.0 {
            position_secs.clamp(0.0, self.duration_secs)
        } else {
            position_secs.max(0.0)
        };

        self.format
            .seek(
                SeekMode::Accurate,
                SeekTo::Time {
                    time: Time::from(position_secs),
                    track_id: Some(self.track_id),
                },
            )
            .map_err(|e| format!("재생 위치 이동 실패: {e}"))?;

        self.decoder.reset();
        self.pending.clear();
        self.pending_idx = 0;
        self.ended = false;
        Ok(())
    }

    fn fill_pending(&mut self) -> Result<bool, String> {
        loop {
            let packet = match self.format.next_packet() {
                Ok(packet) => packet,
                Err(Error::ResetRequired) => continue,
                Err(_) => return Ok(false),
            };

            if packet.track_id() != self.track_id {
                continue;
            }

            let decoded = self
                .decoder
                .decode(&packet)
                .map_err(|e| format!("오디오 디코딩 실패: {e}"))?;

            let spec = *decoded.spec();
            self.sample_buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
            self.sample_buf.copy_interleaved_ref(decoded);
            self.pending.clear();
            self.pending.extend_from_slice(self.sample_buf.samples());
            self.pending_idx = 0;
            return Ok(true);
        }
    }

}

impl Iterator for SymphoniaSource {
    type Item = f32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.ended {
            return None;
        }

        loop {
            if self.pending_idx < self.pending.len() {
                let sample = self.pending[self.pending_idx];
                self.pending_idx += 1;
                return Some(sample);
            }

            match self.fill_pending() {
                Ok(true) => continue,
                Ok(false) => {
                    self.ended = true;
                    return None;
                }
                Err(_) => {
                    self.ended = true;
                    return None;
                }
            }
        }
    }
}

impl Source for SymphoniaSource {
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    fn channels(&self) -> u16 {
        self.channels
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        if self.duration_secs > 0.0 {
            Some(Duration::from_secs_f64(self.duration_secs))
        } else {
            None
        }
    }
}

pub fn open_and_seek(path: &Path, position_secs: f64) -> Result<(SymphoniaSource, f64), String> {
    let source = SymphoniaSource::open(path, position_secs)?;
    let duration = source.duration_secs;
    Ok((source, duration))
}
