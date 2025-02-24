
import type { Artist } from "./artist";
import type { Venue } from "./venue";
import type { Setlist } from "./setlist";

export interface Show {
  id: string;
  ticketmaster_id: string;
  artist_id: string;
  venue_id: string;
  date: string;
  status?: string;
  ticket_url?: string;
  created_at?: string;
  artist?: Artist;
  venue?: Venue;
  setlist?: Setlist;
}
