
import type { Artist } from "./artist";
import type { Venue } from "./venue";
import type { Setlist } from "./setlist";
import type { PlatformIdentifier } from "./sync";

export interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  date: string;
  status?: string;
  ticket_url?: string;
  created_at?: string;
  artist?: Artist;
  venue?: Venue;
  setlist?: Setlist;
  platform_identifiers?: PlatformIdentifier[];
}
