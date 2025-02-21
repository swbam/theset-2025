
export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_name: string;
  votes: number;
  is_top_track: boolean;
  spotify_id?: string;
  suggested?: boolean;
}

export interface Setlist {
  id: string;
  show_id: string;
  name: string;
  created_by: string;
  created_at: string;
  status: string;
  songs: SetlistSong[];
}

export interface CreateSetlistParams {
  showName: string;
  venueId?: string;
}

export interface AddSongParams {
  songName: string;
  setlistId: string;
  spotifyId?: string;
}
