import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeVoting {
  private channel: RealtimeChannel | null = null;

  /**
   * Subscribe to real-time voting updates for a specific setlist
   */
  subscribeToVoting(setlistId: string, onVoteUpdate: (payload: any) => void) {
    // Clean up existing subscription
    this.unsubscribe();

    // Create new channel for this setlist
    this.channel = supabase.channel(`setlist-${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'song_votes',
          filter: `setlist_song_id=in.(select id from setlist_songs where setlist_id='${setlistId}')`
        },
        (payload) => {
          console.log('Vote update received:', payload);
          onVoteUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return this.channel;
  }

  /**
   * Subscribe to setlist changes (new songs added)
   */
  subscribeToSetlistChanges(setlistId: string, onSetlistUpdate: (payload: any) => void) {
    const setlistChannel = supabase.channel(`setlist-changes-${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          console.log('Setlist update received:', payload);
          onSetlistUpdate(payload);
        }
      )
      .subscribe();

    return setlistChannel;
  }

  /**
   * Broadcast a vote to all connected clients
   */
  async broadcastVote(setlistId: string, songId: string, userId: string) {
    if (!this.channel) return;

    const response = await this.channel.send({
      type: 'broadcast',
      event: 'vote_cast',
      payload: {
        setlistId,
        songId,
        userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Vote broadcast response:', response);
  }

  /**
   * Clean up subscription
   */
  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeVoting = new RealtimeVoting();