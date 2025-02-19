import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types';

type SyncEventType = Database['public']['Tables']['sync_events']['Row']['type'];
type SyncEventStatus = Database['public']['Tables']['sync_events']['Row']['status'];
type Platform = Database['public']['Tables']['sync_events']['Row']['platform'];

interface SyncEvent {
  type: SyncEventType;
  status: SyncEventStatus;
  platform: Platform;
  artistId?: string;
  platformId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export const artistSyncMonitoring = {
  /**
   * Log a sync event to the monitoring system
   */
  async logSyncEvent(event: SyncEvent) {
    try {
      const { error } = await supabase
        .from('sync_events')
        .insert({
          type: event.type,
          status: event.status,
          platform: event.platform,
          artist_id: event.artistId,
          platform_id: event.platformId,
          error: event.error,
          metadata: event.metadata,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging sync event:', error);
      }
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  },

  /**
   * Get recent sync events for an artist
   */
  async getArtistSyncHistory(artistId: string, limit = 10) {
    const { data, error } = await supabase
      .from('sync_events')
      .select('*')
      .eq('artist_id', artistId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sync history:', error);
      return [];
    }

    return data;
  },

  /**
   * Get sync status metrics
   */
  async getSyncMetrics(timeframe: 'hour' | 'day' | 'week' = 'day') {
    const { data: metrics, error } = await supabase
      .rpc('check_sync_health', {
        check_period: `${timeframe === 'hour' ? '1 hour' : 
                       timeframe === 'day' ? '1 day' : 
                       '7 days'}`
      });

    if (error) {
      console.error('Error fetching sync metrics:', error);
      return null;
    }

    const { data: events } = await supabase
      .from('sync_events')
      .select('*')
      .gte('timestamp', `now() - interval '${
        timeframe === 'hour' ? '1 hour' : 
        timeframe === 'day' ? '24 hours' : 
        '7 days'
      }'`);

    const syncEvents = events || [];

    return {
      ...metrics?.[0],
      byPlatform: {
        spotify: syncEvents.filter(e => e.platform === 'spotify').length,
        ticketmaster: syncEvents.filter(e => e.platform === 'ticketmaster').length
      },
      byType: {
        artist_sync: syncEvents.filter(e => e.type === 'artist_sync').length,
        platform_link: syncEvents.filter(e => e.type === 'platform_link').length,
        identifier_update: syncEvents.filter(e => e.type === 'identifier_update').length
      }
    };
  },

  /**
   * Check for potential sync issues
   */
  async checkSyncHealth() {
    const { data: metrics, error } = await supabase
      .rpc('check_sync_health');

    if (error) {
      console.error('Error checking sync health:', error);
      return null;
    }

    const { data: recentErrors } = await supabase
      .from('sync_events')
      .select('*')
      .eq('status', 'error')
      .gte('timestamp', `now() - interval '1 hour'`)
      .order('timestamp', { ascending: false });

    const healthData = metrics?.[0];
    
    if (!healthData) {
      return {
        status: 'unknown',
        errorRate: 0,
        recentErrors: []
      };
    }

    return {
      status: healthData.status,
      errorRate: healthData.error_rate,
      totalEvents: healthData.total_events,
      errorEvents: healthData.error_events,
      recentErrors: (recentErrors || []).map(e => ({
        type: e.type,
        platform: e.platform,
        error: e.error,
        timestamp: e.timestamp
      }))
    };
  }
};
