// Real vote calculations from Supabase database - NO MOCK DATA
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseSongRecord } from "@/types/setlist";

export async function calculateSongVotes(setlistId: string): Promise<DatabaseSongRecord[]> {
  try {
    // Get all songs in this setlist from the setlists.songs JSON column
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (setlistError || !setlistData?.songs) {
      console.error('Error fetching setlist songs:', setlistError);
      return [];
    }

    const songs = Array.isArray(setlistData.songs) ? setlistData.songs : [];

    // Calculate real votes for each song
    const songsWithVotes = await Promise.all(
      songs.map(async (song: any) => {
        // Count real votes from user_votes table
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
          total_votes: count || 0, // Real vote count from database
          suggested: song.suggested || false
        };
      })
    );

    // Sort by vote count descending
    return songsWithVotes.sort((a, b) => b.total_votes - a.total_votes);

  } catch (error) {
    console.error('Error in calculateSongVotes:', error);
    return [];
  }
}

export async function getUserVoteCount(userId: string, setlistId: string): Promise<number> {
  try {
    // Get songs in this setlist
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (setlistError || !setlistData?.songs) {
      return 0;
    }

    const songs = Array.isArray(setlistData.songs) ? setlistData.songs : [];
    const songIds = songs.map((song: any) => song.id).filter(Boolean);

    if (songIds.length === 0) {
      return 0;
    }

    // Count user's votes for songs in this setlist
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
