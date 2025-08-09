import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SetlistSong {
  id: string;
  spotify_id: string;
  name: string;
  artist_name?: string;
  votes: number;
  user_voted: boolean;
  suggested: boolean;
}

export function useRealtimeSetlist(showId: string, userId?: string) {
  const [setlist, setSetlist] = useState<SetlistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSetlist = useCallback(async () => {
    try {
      // Get setlist id by show
      const { data: setlistRow } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .maybeSingle();

      if (!setlistRow?.id) {
        setSetlist([]);
        return;
      }

      // Get songs with vote counts using RPC
      const { data: songsData } = await supabase.rpc('get_setlist_with_votes', {
        setlist_uuid: setlistRow.id,
      });

      if (Array.isArray(songsData)) {
        // Determine which songs this user voted for
        let userVotedSet = new Set<string>();
        if (userId) {
          const { data: votes } = await supabase
            .from('song_votes')
            .select('setlist_song_id')
            .eq('user_id', userId);
          userVotedSet = new Set((votes || []).map((v: { setlist_song_id: string }) => v.setlist_song_id));
        }

        const mapped = (songsData as Array<{ id: string; spotify_id: string | null; song_name: string; total_votes: number | null; suggested: boolean }>)
          .map((s) => ({
          id: s.id,
          spotify_id: s.spotify_id || '',
          name: s.song_name,
          votes: s.total_votes ?? 0,
          user_voted: userVotedSet.has(s.id),
          suggested: s.suggested,
        }));

        setSetlist(mapped);
      }
    } catch (error) {
      console.error('Error loading setlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showId, userId]);

  useEffect(() => {
    loadSetlist();
  }, [loadSetlist]);

  // Real-time subscription for votes
  useEffect(() => {
    const channel = supabase.channel(`show:${showId}`);

    // Subscribe to vote changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'song_votes',
      },
      () => {
        loadSetlist();
      },
    );

    // Subscribe to setlist mutations (songs added / removed)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'setlist_songs',
      },
      () => {
        loadSetlist();
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, loadSetlist]);

  return {
    setlist,
    isLoading,
    refreshSetlist: loadSetlist
  };
}
