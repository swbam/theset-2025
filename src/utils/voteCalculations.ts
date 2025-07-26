import { supabase } from "@/integrations/supabase/client";

export interface SongWithVotes {
  id: string;
  song_name: string;
  total_votes: number;
  suggested: boolean;
  spotify_id?: string;
  album?: string;
  preview_url?: string;
  popularity?: number;
}

export const calculateSongVotes = async (setlistId: string): Promise<SongWithVotes[]> => {
  try {
    // Get setlist with songs
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('songs')
      .eq('id', setlistId)
      .single();

    if (setlistError) {
      console.error('Error fetching setlist:', setlistError);
      return [];
    }

    const songs = Array.isArray(setlist.songs) ? setlist.songs : [];
    
    // Calculate vote counts for each song
    const songsWithVotes = await Promise.all(
      songs.map(async (song: any) => {
        // Count votes for this song
        const { count: voteCount, error: voteError } = await supabase
          .from('user_votes')
          .select('*', { count: 'exact', head: true })
          .eq('song_id', song.id);

        if (voteError) {
          console.error('Error counting votes for song:', song.id, voteError);
        }

        return {
          id: song.id,
          song_name: song.song_name || song.name || 'Unknown Song',
          total_votes: voteCount || 0,
          suggested: song.suggested || false,
          spotify_id: song.spotify_id,
          album: song.album,
          preview_url: song.preview_url,
          popularity: song.popularity
        };
      })
    );

    // Sort by vote count (highest first) then by popularity
    return songsWithVotes.sort((a, b) => {
      if (b.total_votes !== a.total_votes) {
        return b.total_votes - a.total_votes;
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

  } catch (error) {
    console.error('Error calculating song votes:', error);
    return [];
  }
};

export const incrementSongVote = async (songId: string): Promise<boolean> => {
  try {
    // This is now handled by the voting system in ShowPage.tsx
    // This function is just a placeholder for any additional vote processing
    return true;
  } catch (error) {
    console.error('Error incrementing vote:', error);
    return false;
  }
};