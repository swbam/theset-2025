
import { supabase } from "../supabase/client";
import type { Platform } from "../supabase/types";

interface SyncEvent {
  platform: string;
  success: boolean;
  type: string;
  artist_id?: string;
  error?: string;
  status?: string;
  check_period?: string;
}

export async function logSyncEvent(event: SyncEvent) {
  try {
    const { error } = await supabase
      .from('sync_events')
      .insert({
        platform: event.platform,
        success: event.success,
        type: event.type,
        artist_id: event.artist_id,
        error: event.error,
        status: event.status,
        check_period: event.check_period
      });

    if (error) throw error;

    // Update sync metrics
    await updateSyncMetrics(event.platform, event.success);
  } catch (error) {
    console.error('Error logging sync event:', error);
  }
}

async function updateSyncMetrics(platform: string, success: boolean) {
  const { data: existingMetrics } = await supabase
    .from('sync_metrics')
    .select('*')
    .eq('platform', platform)
    .single();

  if (existingMetrics) {
    await supabase
      .from('sync_metrics')
      .update({
        success_count: success ? existingMetrics.success_count + 1 : existingMetrics.success_count,
        error_count: success ? existingMetrics.error_count : existingMetrics.error_count + 1,
        last_sync_time: new Date().toISOString(),
        platform
      })
      .eq('id', existingMetrics.id);
  } else {
    await supabase
      .from('sync_metrics')
      .insert({
        platform,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        last_sync_time: new Date().toISOString()
      });
  }
}

export async function checkSyncHealth(platform: Platform) {
  try {
    const { data, error } = await supabase.rpc('check_sync_health', {
      platform
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        health_status: 'unknown',
        last_sync: null,
        error_rate: 0
      };
    }

    const health = data[0];
    
    return {
      health_status: health.health_status,
      last_sync: health.last_sync,
      error_rate: health.error_rate
    };
  } catch (error) {
    console.error('Error checking sync health:', error);
    return {
      health_status: 'error',
      last_sync: null,
      error_rate: 100
    };
  }
}
