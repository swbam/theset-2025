
import type { Json } from "./utils";

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  cover_image_url?: string;
  metadata?: Json;
  spotify_id?: string;
  ticketmaster_id?: string;
  genres?: string[];
  last_synced_at?: string;
}
