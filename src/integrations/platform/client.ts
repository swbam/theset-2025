import { supabase } from '@/integrations/supabase/client';
import type {
  EntityType,
  PlatformIdentifier,
  SyncPlatform,
} from '@/types/sync';

export class PlatformClient {
  static async getIdentifier(
    platform: SyncPlatform,
    platformId: string,
    entityType: EntityType
  ): Promise<PlatformIdentifier | null> {
    const { data, error } = await supabase
      .from('platform_identifiers')
      .select('*')
      .eq('platform', platform)
      .eq('platform_id', platformId)
      .eq('entity_type', entityType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching platform identifier:', error);
      return null;
    }

    return data as PlatformIdentifier;
  }

  static async linkIdentifier(
    entityType: EntityType,
    entityId: string,
    platform: SyncPlatform,
    platformId: string,
    metadata?: Record<string, any>
  ): Promise<PlatformIdentifier | null> {
    const { data, error } = await supabase
      .from('platform_identifiers')
      .upsert({
        entity_type: entityType as string,
        entity_id: entityId,
        platform,
        platform_id: platformId,
        metadata,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error linking platform identifier:', error);
      return null;
    }

    return data as PlatformIdentifier;
  }

  static async updateSyncMetrics(
    platform: SyncPlatform,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('update_sync_metrics', {
      p_platform: platform,
      p_success: success,
      p_error_message: errorMessage,
    });

    if (error) {
      console.error('Error updating sync metrics:', error);
    }
  }

  static async needsSync(
    lastSync: string | null,
    ttlHours = 24
  ): Promise<boolean> {
    if (!lastSync) return true;

    const { data, error } = await supabase.rpc('needs_sync', {
      last_sync: lastSync,
      ttl_hours: ttlHours,
    });

    if (error) {
      console.error('Error checking sync status:', error);
      return true;
    }

    return data;
  }
}
