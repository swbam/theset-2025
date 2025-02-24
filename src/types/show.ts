
import type { Json } from "./utils";
import type { CachedVenue } from "./venue";
import type { Artist } from "./artist";

export interface ShowBase {
  id: string;
  name: string;
  artist_id: string;
  venue_id?: string;
  ticket_url?: string;
  status?: string;
}

export interface CachedShow extends ShowBase {
  platform_id: string;
  date: string;
  venue_name?: string;
  venue_location?: string;
  price_ranges?: Json;
  last_synced_at?: string;
  artist?: Artist;
  venue?: CachedVenue;
}

export interface ShowWithVenue extends CachedShow {
  venue: CachedVenue;
}

export interface ShowCardProps {
  show: CachedShow;
  onViewSetlist?: (show: CachedShow) => void;
}
