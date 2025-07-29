import { useEffect, useState } from 'react';
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

  const loadSetlist = async () => {
    try {
      const { data: setlistData } = await supabase
        .from('setlists')
        .select('songs')
        .eq('show_id', showId)
        .single();

      if (setlistData?.songs && Array.isArray(setlistData.songs)) {
        // Get vote counts and user votes
        const songsWithVotes = await Promise.all(
          setlistData.songs.map(async (song: any) => {
            // Get total votes for this song
            const { count: voteCount } = await supabase
              .from('votes')
              .select('*', { count: 'exact' })
              .eq('show_id', showId)
              .eq('song_id', song.spotify_id);

            // Check if user has voted
            let userVoted = false;
            if (userId) {
              const { count: userVoteCount } = await supabase
                .from('user_votes')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .eq('song_id', song.spotify_id);
              userVoted = (userVoteCount || 0) > 0;
            }

            return {
              id: song.spotify_id,
              spotify_id: song.spotify_id,
              name: song.name,
              artist_name: song.artist_name,
              votes: voteCount || 0,
              user_voted: userVoted,
              suggested: song.suggested || false
            };
          })
        );

        // Sort by votes (descending)
        songsWithVotes.sort((a, b) => b.votes - a.votes);
        setSetlist(songsWithVotes);
      }
    } catch (error) {
      console.error('Error loading setlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSetlist();
  }, [showId, userId]);

  // Real-time subscription for votes
  useEffect(() => {
    const channel = supabase
      .channel(`show:${showId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `show_id=eq.${showId}`
        },
        () => {
          // Reload setlist when votes change
          loadSetlist();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlists',
          filter: `show_id=eq.${showId}`
        },
        () => {
          // Reload setlist when songs are added/removed
          loadSetlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId]);

  return {
    setlist,
    isLoading,
    refreshSetlist: loadSetlist
  };
}