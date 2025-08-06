import { supabase } from '@/integrations/supabase/client';

/**
 * Call the Postgres rpc `vote_on_song` to cast a vote.
 * The database function is expected to:
 *  - insert into user_votes(user_id, song_id, show_id)
 *  - raise an exception / return error when the unique (user_id, song_id) constraint is violated.
 *
 * This helper handles duplicate-vote errors and returns a discriminated union result
 */

export async function voteOnSong({
  songId,
  setlistId,
  showId,
  userId,
}: {
  songId: string;
  setlistId: string;
  showId: string;
  userId: string;
}): Promise<{ status: 'success' } | { status: 'duplicate' } | { status: 'error'; message: string }> {
  const { data, error } = await supabase.rpc('vote_on_song', {
    p_user_id: userId,
    p_song_id: songId,
    p_setlist_id: setlistId,
    p_show_id: showId,
  });

  if (error) {
    // Postgres unique_violation error code
    if ((error as any).code === '23505') {
      return { status: 'duplicate' };
    }
    return {
      status: 'error',
      message: error.message,
    };
  }

  // Broadcast is handled in DB trigger – nothing else to do
  return { status: 'success' };
}

