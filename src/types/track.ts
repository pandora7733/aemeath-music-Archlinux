export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number; // 초
    artworkUrl?: string;
}