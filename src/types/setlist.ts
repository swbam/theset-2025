export interface SetlistSong {
  id: string;
  song_name: string;
  total_votes: number;
  suggested?: boolean;
}

export interface DatabaseSongRecord {
  id: string;
  name?: string;
  song_name: string;
  total_votes: number;
  suggested?: boolean;
}

// Interface for songs stored in the setlists.songs JSON column
export interface StoredSetlistSong {
  id: string;
  name?: string;
  song_name?: string;
  suggested?: boolean;
}

export interface Setlist {
  id: string;
  name?: string;
  songs: SetlistSong[];
  created_at?: string;
  show_id: string;
}
