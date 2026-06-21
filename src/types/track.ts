export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  artworkUrl?: string;
  lyrics?: string[];
}
