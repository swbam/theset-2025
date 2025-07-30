import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealTimeUpdate {
  type: 'vote' | 'comment' | 'setlist_update';
  showId: string;
  data: any;
  timestamp: string;
}

export const useRealTimeUpdates = (tables: string[], onUpdate?: () => void) => {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tables.length) return;

    const channels = tables.map(table => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`Real-time update on ${table}:`, payload);
            setUpdates(prev => [...prev, {
              type: 'setlist_update',
              showId: '',
              data: payload,
              timestamp: new Date().toISOString()
            }]);
            onUpdate?.();
          }
        )
        .subscribe((status) => {
          console.log(`Real-time subscription status for ${table}:`, status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      return channel;
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [tables, onUpdate]);

  const clearUpdates = () => setUpdates([]);

  return {
    updates,
    isConnected,
    clearUpdates
  };
};