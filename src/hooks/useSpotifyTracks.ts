
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
      if (!artistName || !setlistId) return null;

      // First check if we already have top tracks in the setlist
      const { data: existingTracks } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .eq('is_top_track', true);

      if (existingTracks && existingTracks.length > 0) {
        return null; // Top tracks already added
      }

      // Get cached songs for the artist
      const { data: songs } = await supabase
        .from('cached_songs')
        .select('*')
        .order('popularity', { ascending: false })
        .limit(10);

      if (!songs || songs.length === 0) return null;

      // Insert top tracks into setlist
      const { data: insertedSongs, error } = await supabase
        .from('setlist_songs')
        .insert(
          songs.map(song => ({
            setlist_id: setlistId,
            song_name: song.name,
            spotify_id: song.spotify_id,
            is_top_track: true
          }))
        )
        .select();

      if (error) {
        console.error('Error inserting top tracks:', error);
        return null;
      }

      return insertedSongs;
    },
    enabled: !!artistName && !!setlistId,
  });
}
