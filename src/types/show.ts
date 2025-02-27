
import type { Artist } from './artist';
import type { Venue } from './venue';
import type { Setlist } from './setlist';

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
}

export interface CachedShow {
  id: string;
  ticketmaster_id: string;
  artist_id: string;
  name: string;
  date: string;
  venue_name?: string;
  venue_location?: Record<string, any>;
  ticket_url?: string;
  last_synced_at?: string;
  created_at?: string;
}
