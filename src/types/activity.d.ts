
export interface SetlistActivity {
  id: string;
  created_at: string;
  name: string;
  show: {
    artist_name: string;
    venue: string;
  };
}

export interface VoteActivity {
  id: string;
  created_at: string;
  setlist_songs: {
    song_name: string;
    setlists: {
      id: string;
      name: string;
      shows: {
        artist_name: string;
        venue: string;
      };
    };
  };
}
