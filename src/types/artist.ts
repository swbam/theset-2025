
import type { PlatformIdentifier } from "./sync";

export interface Artist {
  id: string;
  name: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  spotify_id?: string | null;
  genres?: string[] | null;
  popularity?: number | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  platform_identifiers?: PlatformIdentifier[];
}
