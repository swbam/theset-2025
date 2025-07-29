import type { PlatformIdentifier } from './sync';
import type { Json } from '@/integrations/supabase/types';

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

export interface DatabaseArtist {
  id: string;
  name: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  spotify_id?: string | null;
  genres?: Json;
  classifications?: Json;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  ticketmaster_id?: string | null;
}

export function transformDatabaseArtist(dbArtist: DatabaseArtist): Artist {
  return {
    ...dbArtist,
    genres: Array.isArray(dbArtist.genres) ? (dbArtist.genres as string[]) : [],
    metadata: dbArtist.metadata as unknown as Record<string, any>,
  };
}
