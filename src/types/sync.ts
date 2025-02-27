
export type SyncPlatform = 'spotify' | 'ticketmaster';
export type EntityType = 'artist' | 'venue' | 'show' | 'song';

export interface PlatformIdentifier {
  id: string;
  entity_id: string;
  entity_type: EntityType;
  platform: SyncPlatform;
  platform_id: string;
  metadata?: Record<string, any> | null;
  last_synced_at?: string;
  created_at?: string;
}

export interface SyncMetrics {
  id: string;
  platform: SyncPlatform;
  last_sync_time?: string | null;
  success_count?: number;
  error_count?: number;
  created_at?: string;
  updated_at?: string;
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

export interface CachedSong {
  id: string;
  spotify_id: string;
  artist_id: string;
  name: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
  last_synced_at?: string;
  created_at?: string;
}
