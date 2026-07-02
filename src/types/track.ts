export interface Track {
    id: string;
    path: string;
    title: string;
    artist: string;
    album?: string;
    duration: number; // 초
    artworkUrl?: string;
    lyrics?: string[]; // 한 줄당 한 항목
}