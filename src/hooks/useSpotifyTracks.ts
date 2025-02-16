
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
}

export function useSpotifyTracks(artistName: string | undefined, setlistId: string | undefined) {
  return useQuery({
    queryKey: ['spotify-tracks', artistName, setlistId],
    queryFn: async () => {
      if (!artistName || !setlistId) {
        console.log('Missing required params:', { artistName, setlistId });
        return null;
      }

      console.log('Checking for top tracks for:', artistName, 'setlist:', setlistId);

      // First check if we already have top tracks in the setlist
      const { data: existingTracks } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .eq('is_top_track', true);

      if (existingTracks && existingTracks.length > 0) {
        console.log('Found existing top tracks:', existingTracks.length);
        return null; // Top tracks already added
      }

      // Get the artist's ID first
      const { data: artist } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', artistName)
        .single();

      if (!artist) {
        console.log('Artist not found:', artistName);
        return null;
      }

      // Get cached songs for the artist
      const { data: songs } = await supabase
        .from('cached_songs')
        .select('*')
        .eq('artist_id', artist.id)
        .order('popularity', { ascending: false })
        .limit(10);

      if (!songs || songs.length === 0) {
        console.log('No cached songs found for artist:', artistName);
        return null;
      }

      console.log('Found cached songs:', songs.length);

      try {
        // Insert top tracks into setlist
        const { data: insertedSongs, error } = await supabase
          .from('setlist_songs')
          .insert(
            songs.map(song => ({
              setlist_id: setlistId,
              song_name: song.name,
              spotify_id: song.spotify_id,
              is_top_track: true,
              total_votes: 0,
              suggested: false
            }))
          )
          .select();

        if (error) {
          console.error('Error inserting top tracks:', error);
          throw error;
        }

        console.log('Successfully inserted top tracks:', insertedSongs?.length);
        return insertedSongs;
      } catch (error) {
        console.error('Failed to insert top tracks:', error);
        throw error;
      }
    },
    enabled: !!artistName && !!setlistId,
    retry: 1
  });
}
