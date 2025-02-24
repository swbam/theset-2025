
import type { User } from "./user";
import type { Song } from "./song";
import type { Show } from "./show";

export interface Vote {
  id: string;
  user_id: string;
  song_id: string;
  show_id: string;
  created_at?: string;
  user?: User;
  song?: Song;
  show?: Show;
}
