
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { getArtistTracks } from "../integrations/spotify/client";
import { useAuth } from "../contexts/AuthContext";

export function useSpotifyTracks(artistName: string | undefined, setlistId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.provider_token;

  return useQuery({
    queryKey: ['spotify-tracks', artistName, setlistId],
    queryFn: async () => {
      if (!artistName || !setlistId || !accessToken) {
        console.log('Missing required params:', { artistName, setlistId, hasToken: !!accessToken });
        return null;
      }

      console.log('Checking for top tracks for:', artistName, 'setlist:', setlistId);

      // First check if we already have tracks in the setlist
      const { data: existingTracks, error: existingError } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .eq('is_top_track', true);

      if (existingError) {
        console.error('Error fetching existing tracks:', existingError);
        throw existingError;
      }

      if (existingTracks && existingTracks.length > 0) {
        console.log('Found existing top tracks:', existingTracks.length);
        return existingTracks;
      }

      // If no cached songs, fetch from Spotify
      console.log('No cached songs found, fetching from Spotify');
      const spotifyTracks = await getArtistTracks(accessToken, artistName);

      // Insert the tracks into our database
      const { data: insertedTracks, error: insertError } = await supabase
        .from('setlist_songs')
        .upsert(
          spotifyTracks.map(track => ({
            setlist_id: setlistId,
            song_name: track.name,
            is_top_track: true,
            votes: 0
          }))
        )
        .select();

      if (insertError) {
        console.error('Error inserting top tracks:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted top tracks:', insertedTracks?.length);
      return insertedTracks;
    },
    enabled: !!artistName && !!setlistId && !!accessToken,
    retry: 1
  });
}
