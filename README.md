# aemeath-music

Apple Music 스타일 UX를 목표로 하는 Tauri 기반 데스크톱 음악 앱입니다.  
로컬 라이브러리 재생, 온라인 곡 탐색(미리듣기), yt-dlp 기반 외부 다운로드를 하나의 앱에서 제공합니다.

## 주요 기능

- 로컬 라이브러리 스캔 (`$HOME/Music`) 및 재생
- SQLite 기반 라이브러리/즐겨찾기/플레이리스트 관리
- 앨범/아티스트/최근 추가 항목 보기
- Deezer + iTunes 기반 온라인 탐색 (홈/신규/검색)
- 30초 미리듣기 캐시 재생
- yt-dlp 런타임 설치/업데이트/삭제 및 다운로드 큐/취소
- 다크/라이트 테마, 상단 플레이어 타이틀 마키, 홈 로컬곡 분리 UI

## 기술 스택

- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, React Router
- Desktop Framework: Tauri 2
- Backend: Rust
- Database: SQLite (`rusqlite`)
- Audio/Metadata: `rodio`, `symphonia`, `lofty`
- External Integration: Deezer Public API, iTunes Search API, yt-dlp

## 빠른 시작

> 모든 명령은 반드시 프로젝트 루트인 `aemeath-music/` 디렉터리에서 실행하세요.

### 1) 요구사항

- Node.js 20+
- npm
- Rust stable toolchain
- Tauri 빌드 의존성 (Linux는 WebKitGTK 계열 라이브러리 필요)

### 2) 의존성 설치

```bash
npm install
```

### 3) 개발 실행

```bash
npm run tauri dev
```

### 4) 프로덕션 빌드

```bash
npm run build
npm run tauri build
```

## Linux 개발 의존성 예시 (Arch)

```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl \
  appmenu-gtk-module libappindicator-gtk3 librsvg alsa-lib
```

## 배포본 다운로드

[Releases](https://github.com/pandora7733/aemeath-music-Archlinux/releases) 페이지에서 OS별 설치 파일을 받을 수 있습니다.

- Linux: `.AppImage`, `.deb`, `.rpm`
- Windows: `.msi` 또는 `.exe`
- macOS: `.dmg`

AppImage 실행 시 렌더링 이슈가 있으면:

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 ./aemeath-music_0.1.0_amd64.AppImage
```

## 앱 데이터 경로

앱 데이터는 기본적으로 `~/.local/share/music-app/`에 저장됩니다.

```text
~/.local/share/music-app/
├── db.sqlite
├── covers/
├── songs/
├── previews/
└── tools/
```

## 프로젝트 구조

```text
aemeath-music/
├── src/                     # React 프론트엔드
├── src-tauri/               # Rust + Tauri 백엔드
│   ├── src/commands/        # Tauri IPC 명령
│   ├── src/services/        # 도메인 서비스
│   ├── src/infrastructure/  # DB/API/플러그인/스캐너
│   └── src/models/          # 공용 모델
└── README.md
```

## 트러블슈팅

### 1) `package.json`을 찾지 못하는 에러

- 증상: `npm ERR! enoent Could not read package.json`
- 원인: 잘못된 디렉터리에서 명령 실행
- 해결: `aemeath-music/` 루트로 이동 후 다시 실행

### 2) 온라인 곡 목록이 계속 로드 실패

- 원인: 인터넷 연결 불안정/오프라인 상태
- 현재 동작: 백엔드와 프론트에서 오프라인 예외를 처리하여  
  `인터넷 연결이 없어 외부 API에서 곡 정보를 가져올 수 없습니다` 메시지를 표시

### 3) 외부 다운로드 실패

- 원인: 인터넷 연결 없음, yt-dlp 미설치, URL 문제
- 현재 동작: 오프라인이면  
  `인터넷 연결이 없어 yt-dlp 다운로드를 진행할 수 없습니다` 메시지를 표시
- 해결: Settings에서 플러그인 상태 확인 후 재시도

## 현재 미구현/개선 예정

- 동기화 가사 (LRC/LRCLIB 연동)
- Discord Rich Presence
- Last.fm 연동
- 다운로드 상세 퍼센트 로그 UI 고도화

## 법적 고지 (Legal Notice)

- 온라인 탐색은 공개 무료 API(Deezer/iTunes)의 메타데이터와 30초 미리듣기만 사용합니다.
- 저장소와 릴리스에는 `yt-dlp` 바이너리를 포함하지 않습니다.
- 다운로드 기능은 사용자 동의 후 공식 릴리스에서 런타임 설치한 도구를 사용합니다.
- 저작권 보호 콘텐츠의 무단 다운로드/배포 책임은 전적으로 사용자에게 있습니다.
- 사용자 본인은 서비스 약관 및 거주 국가 법률을 준수해야 합니다.

## 기여

이슈/PR은 언제든 환영합니다.  
규모가 큰 변경은 먼저 이슈로 방향을 논의해 주세요.

## 라이선스

현재 저장소 라이선스 정책은 확정 전입니다.
