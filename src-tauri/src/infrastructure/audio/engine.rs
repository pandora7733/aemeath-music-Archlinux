use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::mpsc::{self, Receiver, SyncSender};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use tauri::{AppHandle, Emitter};

use crate::models::playback_state::PlaybackStateDto;

enum AudioCommand {
    Play {
        path: PathBuf,
        reply: SyncSender<Result<PlaybackStateDto, String>>,
    },
    TogglePause {
        reply: SyncSender<Result<PlaybackStateDto, String>>,
    },
    SetVolume {
        volume: f32,
        reply: SyncSender<Result<PlaybackStateDto, String>>,
    },
    Seek {
        position_secs: f64,
        reply: SyncSender<Result<PlaybackStateDto, String>>,
    },
    GetState {
        reply: SyncSender<PlaybackStateDto>,
    },
}

struct LocalEngine {
    handle: OutputStreamHandle,
    sink: Option<Sink>,
    current_path: Option<PathBuf>,
    volume: f32,
    duration_secs: f64,
    offset_secs: f64,
    started_at: Option<Instant>,
    paused: bool,
}

impl LocalEngine {
    fn new(handle: OutputStreamHandle) -> Self {
        Self {
            handle,
            sink: None,
            current_path: None,
            volume: 0.8,
            duration_secs: 0.0,
            offset_secs: 0.0,
            started_at: None,
            paused: false,
        }
    }

    fn play(&mut self, path: &PathBuf) -> Result<f64, String> {
        self.stop_internal();

        let file = File::open(path).map_err(|e| format!("파일을 열 수 없습니다: {e}"))?;
        let source = Decoder::new(BufReader::new(file))
            .map_err(|e| format!("오디오 파일을 디코딩할 수 없습니다: {e}"))?;

        let duration_secs = source
            .total_duration()
            .map(|d| d.as_secs_f64())
            .unwrap_or(0.0);

        let sink = Sink::try_new(&self.handle)
            .map_err(|e| format!("오디오 싱크를 생성할 수 없습니다: {e}"))?;
        sink.set_volume(self.volume);
        sink.append(source);

        self.sink = Some(sink);
        self.current_path = Some(path.clone());
        self.duration_secs = duration_secs;
        self.offset_secs = 0.0;
        self.started_at = Some(Instant::now());
        self.paused = false;

        Ok(duration_secs)
    }

    fn toggle_pause(&mut self) {
        let Some(sink) = self.sink.as_ref() else {
            return;
        };

        if self.paused {
            sink.play();
            self.started_at = Some(Instant::now());
            self.paused = false;
        } else {
            self.offset_secs = self.position_secs();
            sink.pause();
            self.paused = true;
        }
    }

    fn set_volume(&mut self, volume: f32) {
        self.volume = volume.clamp(0.0, 1.0);
        if let Some(sink) = self.sink.as_ref() {
            sink.set_volume(self.volume);
        }
    }

    fn seek(&mut self, position_secs: f64) {
        self.offset_secs = position_secs.clamp(0.0, self.duration_secs);
        if !self.paused {
            self.started_at = Some(Instant::now());
        }
    }

    fn position_secs(&self) -> f64 {
        if self.sink.is_none() {
            return 0.0;
        }
        if self.paused {
            return self.offset_secs;
        }
        let elapsed = self
            .started_at
            .map(|t| t.elapsed().as_secs_f64())
            .unwrap_or(0.0);
        (self.offset_secs + elapsed).min(self.duration_secs)
    }

    fn is_playing(&self) -> bool {
        self.sink
            .as_ref()
            .map(|sink| !sink.empty() && !self.paused)
            .unwrap_or(false)
    }

    fn has_track(&self) -> bool {
        self.sink.is_some()
    }

    fn sink_empty(&self) -> bool {
        self.sink.as_ref().map(|s| s.empty()).unwrap_or(true)
    }

    fn snapshot(&self) -> PlaybackStateDto {
        PlaybackStateDto {
            path: self
                .current_path
                .as_ref()
                .map(|p| p.to_string_lossy().to_string()),
            is_playing: self.is_playing(),
            position_secs: self.position_secs(),
            duration_secs: self.duration_secs,
            volume: self.volume,
        }
    }

    fn stop_internal(&mut self) {
        self.sink = None;
        self.current_path = None;
        self.duration_secs = 0.0;
        self.offset_secs = 0.0;
        self.started_at = None;
        self.paused = false;
    }
}

pub struct AudioPlayerHandle {
    tx: SyncSender<AudioCommand>,
    _thread: JoinHandle<()>,
}

impl AudioPlayerHandle {
    pub fn spawn(app: AppHandle) -> Result<Self, String> {
        let (tx, rx) = mpsc::sync_channel::<AudioCommand>(32);

        let thread = thread::spawn(move || {
            if let Err(e) = run_audio_thread(app, rx) {
                eprintln!("Audio thread error: {e}");
            }
        });

        Ok(Self {
            tx,
            _thread: thread,
        })
    }

    fn send_play(&self, path: PathBuf) -> Result<PlaybackStateDto, String> {
        let (reply_tx, reply_rx) = mpsc::sync_channel(1);
        self.tx
            .send(AudioCommand::Play {
                path,
                reply: reply_tx,
            })
            .map_err(|e| format!("오디오 명령 전송 실패: {e}"))?;
        reply_rx
            .recv()
            .map_err(|e| format!("오디오 응답 수신 실패: {e}"))?
    }

    fn send_toggle_pause(&self) -> Result<PlaybackStateDto, String> {
        let (reply_tx, reply_rx) = mpsc::sync_channel(1);
        self.tx
            .send(AudioCommand::TogglePause { reply: reply_tx })
            .map_err(|e| format!("오디오 명령 전송 실패: {e}"))?;
        reply_rx
            .recv()
            .map_err(|e| format!("오디오 응답 수신 실패: {e}"))?
    }

    fn send_set_volume(&self, volume: f32) -> Result<PlaybackStateDto, String> {
        let (reply_tx, reply_rx) = mpsc::sync_channel(1);
        self.tx
            .send(AudioCommand::SetVolume {
                volume,
                reply: reply_tx,
            })
            .map_err(|e| format!("오디오 명령 전송 실패: {e}"))?;
        reply_rx
            .recv()
            .map_err(|e| format!("오디오 응답 수신 실패: {e}"))?
    }

    fn send_seek(&self, position_secs: f64) -> Result<PlaybackStateDto, String> {
        let (reply_tx, reply_rx) = mpsc::sync_channel(1);
        self.tx
            .send(AudioCommand::Seek {
                position_secs,
                reply: reply_tx,
            })
            .map_err(|e| format!("오디오 명령 전송 실패: {e}"))?;
        reply_rx
            .recv()
            .map_err(|e| format!("오디오 응답 수신 실패: {e}"))?
    }

    fn send_get_state(&self) -> Result<PlaybackStateDto, String> {
        let (reply_tx, reply_rx) = mpsc::sync_channel(1);
        self.tx
            .send(AudioCommand::GetState { reply: reply_tx })
            .map_err(|e| format!("오디오 명령 전송 실패: {e}"))?;
        reply_rx
            .recv()
            .map_err(|e| format!("오디오 응답 수신 실패: {e}"))
    }

    pub fn play(&self, path: PathBuf) -> Result<PlaybackStateDto, String> {
        self.send_play(path)
    }

    pub fn toggle_pause(&self) -> Result<PlaybackStateDto, String> {
        self.send_toggle_pause()
    }

    pub fn set_volume(&self, volume: f32) -> Result<PlaybackStateDto, String> {
        self.send_set_volume(volume)
    }

    pub fn seek(&self, position_secs: f64) -> Result<PlaybackStateDto, String> {
        self.send_seek(position_secs)
    }

    pub fn get_state(&self) -> Result<PlaybackStateDto, String> {
        self.send_get_state()
    }
}

fn run_audio_thread(app: AppHandle, rx: Receiver<AudioCommand>) -> Result<(), String> {
    let (_stream, handle) =
        OutputStream::try_default().map_err(|e| format!("오디오 출력을 초기화할 수 없습니다: {e}"))?;
    let mut engine = LocalEngine::new(handle);

    loop {
        while let Ok(command) = rx.try_recv() {
            match command {
                AudioCommand::Play { path, reply } => {
                    let result = engine.play(&path).map(|duration| {
                        let mut snapshot = engine.snapshot();
                        if snapshot.duration_secs == 0.0 {
                            snapshot.duration_secs = duration;
                        }
                        snapshot
                    });
                    let _ = reply.send(result);
                }
                AudioCommand::TogglePause { reply } => {
                    engine.toggle_pause();
                    let _ = reply.send(Ok(engine.snapshot()));
                }
                AudioCommand::SetVolume { volume, reply } => {
                    engine.set_volume(volume);
                    let _ = reply.send(Ok(engine.snapshot()));
                }
                AudioCommand::Seek {
                    position_secs,
                    reply,
                } => {
                    engine.seek(position_secs);
                    let _ = reply.send(Ok(engine.snapshot()));
                }
                AudioCommand::GetState { reply } => {
                    let _ = reply.send(engine.snapshot());
                }
            }
        }

        if engine.has_track() && engine.sink_empty() {
            let snapshot = engine.snapshot();
            engine.stop_internal();
            let _ = app.emit("player-ended", snapshot);
        } else if engine.has_track() {
            let _ = app.emit("player-tick", engine.snapshot());
        }

        thread::sleep(Duration::from_millis(250));
    }
}

pub fn create_audio_player(app: AppHandle) -> Result<AudioPlayerHandle, String> {
    AudioPlayerHandle::spawn(app)
}
