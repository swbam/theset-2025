import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealTimeUpdate {
  type: 'vote' | 'comment' | 'setlist_update';
  showId: string;
  data: any;
  timestamp: string;
}

export const useRealTimeUpdates = (showId?: string) => {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!showId) return;

    let channel: RealtimeChannel;

    const setupRealTime = () => {
      // Subscribe to votes changes for this show
      channel = supabase
        .channel(`show-updates-${showId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
            filter: `show_id=eq.${showId}`
          },
          (payload) => {
            console.log('Real-time vote update:', payload);
            setUpdates(prev => [...prev, {
              type: 'vote',
              showId,
              data: payload,
              timestamp: new Date().toISOString()
            }]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'setlist_songs',
            filter: `show_id=eq.${showId}`
          },
          (payload) => {
            console.log('Real-time setlist update:', payload);
            setUpdates(prev => [...prev, {
              type: 'setlist_update',
              showId,
              data: payload,
              timestamp: new Date().toISOString()
            }]);
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupRealTime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [showId]);

  const clearUpdates = () => setUpdates([]);

  return {
    updates,
    isConnected,
    clearUpdates
  };
};