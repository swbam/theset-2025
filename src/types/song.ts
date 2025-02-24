
import type { Artist } from "./artist";

export interface Song {
  id: string;
  spotify_id: string;
  title: string;
  artist_id: string;
  created_at?: string;
  artist?: Artist;
}
