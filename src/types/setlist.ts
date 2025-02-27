
export interface SetlistSong {
  id: string;
  song_name: string;
  total_votes: number;
  suggested?: boolean;
}

export interface Setlist {
  id: string;
  name?: string;
  songs: SetlistSong[];
  created_at?: string;
  show_id: string;
}
