# aemeath-music

로컬 `Music` 폴더의 음원을 재생하고, 온라인 차트 탐색·30초 미리듣기·곡 다운로드를 지원하는 데스크톱 음악 플레이어입니다.  
Tauri 2 + React + Rust로 제작되었습니다.

**현재 버전: `0.1.0`**

---

## 다운로드

[Releases](https://github.com/pandora7733/aemeath-music-Archlinux/releases)에서 OS에 맞는 설치 파일을 받을 수 있습니다.

| OS | 권장 파일 | 설명 |
|----|-----------|------|
| Linux (범용) | `.AppImage` | Ubuntu, Fedora, Arch 등 대부분의 배포판 |
| Ubuntu / Debian / Mint | `.deb` | Debian 계열 패키지 |
| Fedora / RHEL / openSUSE | `.rpm` | Red Hat 계열 패키지 |
| Windows | `.msi` 또는 `.exe` | Windows 설치 프로그램 |
| macOS | `.dmg` | Apple Silicon / Intel 각각 제공 |

### Linux 설치 예시

**AppImage (권장 — 배포판 공통)**

```bash
chmod +x aemeath-music_0.1.0_amd64.AppImage
./aemeath-music_0.1.0_amd64.AppImage
```

**Debian / Ubuntu**

```bash
sudo dpkg -i aemeath-music_0.1.0_amd64.deb
sudo apt-get install -f   # 의존성 오류 시
```

**Fedora / RHEL**

```bash
sudo dnf install ./aemeath-music-0.1.0-1.x86_64.rpm
```

> AppImage 실행 시 화면이 하얗게 나오면 아래 환경 변수로 실행해 보세요.  
> `WEBKIT_DISABLE_DMABUF_RENDERER=1 ./aemeath-music_0.1.0_amd64.AppImage`

---

## 사용 방법

1. 앱을 실행합니다.
2. 사이드바 **보관함 → 노래** 로 이동합니다.
3. `$HOME/Music` 폴더(예: `/home/사용자/Music`)가 자동으로 스캔됩니다.
4. 목록에서 곡을 **더블클릭**하거나 **Enter** 키로 재생합니다.

음원은 인터넷에서 가져오지 않으며, 로컬 파일만 재생합니다.

---

## 현재 구현된 기능 (v0.1.0)

### 라이브러리

- `$HOME/Music` 하위 폴더 **재귀 스캔**
- **노래** 페이지에서 전체 음원 목록 표시
- **다시 스캔** 버튼으로 라이브러리 갱신
- 제목순 정렬

### 재생

- 재생 / 일시정지
- 이전 곡 / 다음 곡
- 재생 위치 탐색(seek)
- 볼륨 조절 및 음소거
- **셔플** 재생
- **반복** 재생 (끔 → 전체 → 한 곡)
- 곡 종료 시 자동으로 다음 곡 재생
- 라이브러리에서 곡 선택 시 해당 목록 전체를 **재생 대기열**로 설정

### UI

- 상단 **플레이어 바** (곡 정보, 진행 바, 컨트롤)
- 우측 **재생 목록** 패널 (지금 재생 중 / 다음 트랙)
- 우측 **가사** 패널 UI (가사 데이터 연동은 미구현)
- 사이드바 네비게이션 및 검색 입력 UI

### 지원 오디오 형식

`mp3`, `flac`, `wav`, `m4a`, `ogg`, `opus`, `aac`, `wma`, `aiff`, `alac`, `webm`

---

### 라이브러리 관리 (M2)

- **SQLite 데이터베이스** — 스캔 결과·플레이리스트·즐겨찾기를 `~/.local/share/music-app/db.sqlite`에 저장
- **태그(메타데이터) 읽기** — mp3/flac/m4a/ogg의 제목·아티스트·앨범·재생시간·앨범아트 추출
- **최근 추가된 항목** — 추가 시각 기준 정렬
- **앨범 / 아티스트** — 태그 기준 자동 그룹화, 앨범아트 그리드
- **즐겨찾기** — 곡 목록의 하트 버튼으로 추가/해제
- **플레이리스트** — 생성·이름 변경·삭제, 곡 추가/제거

### 온라인 탐색 (M2)

- **홈** — Deezer 공개 API 기반 인기 차트
- **신규** — 신곡 탐색
- **검색** — 온라인 곡 검색 (Deezer → iTunes 폴백)
- **30초 미리듣기** — 다운로드 없이 공식 미리듣기 재생

### 다운로드 (M2)

- **yt-dlp 플러그인** — 동의 후 공식 릴리스에서 런타임 설치 (앱에 미포함)
- 탐색한 곡을 최고 음질 오디오로 다운로드 → 라이브러리 자동 등록

---

## 아직 구현되지 않은 기능

| 메뉴 | 상태 |
|------|------|
| 가사 표시 | 패널 UI만 있음 (LRC/메타데이터 파싱 미구현) |
| 미니 플레이어 창 | Tauri 설정만 존재, UI 미연동 |
| 다운로드 진행률 표시 | 시작/완료/실패 상태만 표시 |

---

## 시스템 요구 사항

| 항목 | 요구 사항 |
|------|-----------|
| CPU | x86_64 (64비트) |
| Linux | WebKitGTK 4.1 지원 배포판 (Ubuntu 22.04+, Fedora 38+ 등) |
| macOS | Apple Silicon 또는 Intel |
| Windows | Windows 10 이상 |
| 음원 위치 | `$HOME/Music` 폴더 |

---

## 개발 환경 설정

### Linux (Arch 등)

```bash
# 의존성 (Arch Linux 예시)
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl \
  appmenu-gtk-module libappindicator-gtk3 librsvg alsa-lib

npm install
npm run tauri dev
```

### 빌드

로컬 빌드는 개발·테스트용입니다. 배포용 설치 파일은 GitHub Actions에서 생성합니다.

```bash
npm run tauri build
```

---

## 기술 스택

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router
- **Backend:** Rust, Tauri 2
- **오디오:** rodio, symphonia (mp3, flac, wav, ogg, vorbis, aac)

---

## 법적 고지 (Legal Notice)

### 온라인 탐색

- 홈/신규/검색 화면의 온라인 곡 정보는 **키 없이 공개적으로 제공되는 무료 API**(Deezer Public API, iTunes Search API)의 메타데이터와 **공식 30초 미리듣기**만 사용합니다.
- 전곡 무단 스트리밍을 하지 않으며, 저장소에는 어떠한 API 키·크리덴셜도 포함되어 있지 않습니다.

### 다운로드 기능과 yt-dlp

- 이 저장소와 릴리스에는 **yt-dlp 바이너리가 포함되어 있지 않습니다.**
- 다운로드 기능을 처음 사용할 때 동의 화면이 표시되며, 동의한 경우에만 [yt-dlp 공식 GitHub 릴리스](https://github.com/yt-dlp/yt-dlp/releases)에서 도구를 내려받아 `~/.local/share/music-app/tools/`에 설치합니다.
- yt-dlp는 퍼블릭 도메인([Unlicense](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE)) 소프트웨어입니다.

### 사용자 책임 (Disclaimer)

- 이 앱의 다운로드 기능은 **저작권이 없거나 자유롭게 이용 가능한 콘텐츠**를 위한 것입니다.
- **DMCA 및 각국 저작권법으로 보호되는 콘텐츠를 무단으로 다운로드하는 행위에 대한 책임은 전적으로 사용자 본인에게 있습니다.**
- 사용자는 각 서비스(YouTube 등)의 이용약관과 거주 국가의 법률을 준수해야 합니다.
- 개발자는 이 앱의 오용으로 발생하는 어떠한 법적 문제에 대해서도 책임지지 않습니다.

---

## 라이선스

아직 명시되지 않았습니다.
