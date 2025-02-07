
export interface VoteActivity {
  id: string;
  created_at: string;
  setlist_songs: {
    song_name: string;
    setlist: {
      id: string;
      name: string;
      show: {
        artist_name: string;
        venue: string;
      };
    };
  };
}
