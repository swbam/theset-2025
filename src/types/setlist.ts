
export interface SetlistSong {
  id: string;
  song_name: string;
  total_votes: number;
  suggested?: boolean;
}

export interface DatabaseSongRecord {
  id?: string;
  name?: string;
  song_name?: string;
  votes?: number;
  total_votes?: number;
  suggested?: boolean;
  spotify_id?: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
}

export interface Setlist {
  id: string;
  name?: string;
  songs: SetlistSong[];
  created_at?: string;
  show_id: string;
}
