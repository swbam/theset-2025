// Real vote calculations from Supabase database - NO MOCK DATA
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseSongRecord, StoredSetlistSong } from '@/types/setlist';

export async function calculateSongVotes(
  setlistId: string
): Promise<DatabaseSongRecord[]> {
  try {
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (setlistError || !setlistData?.songs) {
      console.error('Error fetching setlist songs:', setlistError);
      return [];
    }

    const songs = Array.isArray(setlistData.songs) ? setlistData.songs as StoredSetlistSong[] : [];

    const songsWithVotes = await Promise.all(
      songs.map(async (song: StoredSetlistSong) => {
        const { count, error: voteError } = await supabase
          .from('user_votes')
          .select('*', { count: 'exact', head: true })
          .eq('song_id', song.id);

        if (voteError) {
          console.error('Error counting votes for song:', song.id, voteError);
        }

        return {
          id: song.id || `song-${Math.random().toString(36).substr(2, 9)}`,
          song_name: song.name || song.song_name || 'Unknown Song',
          total_votes: count || 0,
          suggested: song.suggested || false,
        };
      })
    );

    return songsWithVotes.sort((a, b) => b.total_votes - a.total_votes);
  } catch (error) {
    console.error('Error in calculateSongVotes:', error);
    return [];
  }
}

export async function getUserVoteCount(
  userId: string,
  setlistId: string
): Promise<number> {
  try {
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (setlistError || !setlistData?.songs) {
      return 0;
    }

    const songs = Array.isArray(setlistData.songs) ? setlistData.songs as StoredSetlistSong[] : [];
    const songIds = songs.map((song: StoredSetlistSong) => song.id).filter(Boolean);

    if (songIds.length === 0) {
      return 0;
    }

    const { count, error } = await supabase
      .from('user_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('song_id', songIds);

    if (error) {
      console.error('Error counting user votes:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserVoteCount:', error);
    return 0;
  }
}
