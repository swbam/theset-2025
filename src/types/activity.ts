export interface ShowVenue {
  name: string;
  city?: string;
  state?: string;
}

export interface SetlistActivity {
  id: string;
  created_at: string;
  name: string;
  shows: {
    artist_name: string;
    venue: string;
  };
}

export interface VoteActivity {
  id: string;
  created_at: string;
  setlist_songs: {
    song_name: string;
    setlist: {
      name: string;
      shows: {
        artist_name: string;
        venue: string;
      };
    };
  };
}
