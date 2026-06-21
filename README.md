# aemeath-music

로컬 `Music` 폴더의 음원을 재생하는 데스크톱 음악 플레이어입니다.  
Tauri 2 + React + Rust로 제작되었으며, 음원 파일은 기기 안에서만 읽고 재생합니다.

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

## 아직 구현되지 않은 기능

다음 메뉴는 UI만 준비되어 있으며, v0.1.0에서는 동작하지 않습니다.

| 메뉴 | 상태 |
|------|------|
| 홈, 신규 | 플레이스홀더 화면 |
| 검색 | 검색 UI만 있음 (결과 표시 미구현) |
| 최근 추가된 항목, 아티스트, 앨범 | 플레이스홀더 화면 |
| 플레이리스트 (모든 플레이리스트, 즐겨찾기) | 플레이스홀더 화면 |
| 시스템 설정 | 플레이스홀더 화면 |
| 가사 표시 | 패널 UI만 있음 (LRC/메타데이터 파싱 미구현) |
| 미니 플레이어 창 | Tauri 설정만 존재, UI 미연동 |
| ID3 태그 기반 아티스트·앨범 정보 | 파일명 기준 제목만 표시 |

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

## 라이선스

아직 명시되지 않았습니다.
