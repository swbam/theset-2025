
import type { Show } from "./show";

export interface SetlistSongs {
  [songId: string]: number; // songId: votes mapping
}

export interface Setlist {
  id: string;
  show_id: string;
  songs: SetlistSongs;
  created_at?: string;
  show?: Show;
}

export interface SetlistWithShow extends Setlist {
  show: Show;
}
