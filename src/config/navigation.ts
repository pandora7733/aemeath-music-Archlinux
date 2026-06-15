export interface NavItem {
  label: string;
  path: string;
}

export const mainNav: NavItem[] = [
  { label: "홈", path: "/" },
  { label: "신규", path: "/new" },
];

export const libraryNav: NavItem[] = [
  { label: "최근 추가된 항목", path: "/library/recent" },
  { label: "아티스트", path: "/library/artists" },
  { label: "앨범", path: "/library/albums" },
  { label: "노래", path: "/library/songs" },
];

export const playlistNav: NavItem[] = [
  { label: "모든 플레이리스트", path: "/playlists" },
  { label: "즐겨찾는 노래", path: "/playlists/favorites" },
];
