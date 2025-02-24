
export type SyncPlatform = 'spotify' | 'ticketmaster';
export type EntityType = 'artist' | 'venue' | 'show';

export interface PlatformIdentifier {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  platform: SyncPlatform;
  platform_id: string;
  metadata?: Record<string, any>;
  last_synced_at: string;
  created_at: string;
}

export interface SyncMetrics {
  id: string;
  platform: SyncPlatform;
  last_sync_time: string | null;
  success_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface SyncEvent {
  id: string;
  platform: SyncPlatform;
  entity_type: EntityType;
  entity_id: string;
  status: 'SUCCESS' | 'ERROR';
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
