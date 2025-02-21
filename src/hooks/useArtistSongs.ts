
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { getArtistTracks } from "../integrations/spotify/client";
import { useAuth } from "../contexts/AuthContext";

export function useArtistSongs(artistId: string | undefined) {
  const { session } = useAuth();
  const accessToken = session?.provider_token;

  return useQuery({
    queryKey: ['artist-songs', artistId],
    queryFn: async () => {
      if (!artistId || !accessToken) return [];

      console.log('Fetching songs for artist:', artistId);

      try {
        // First try to get cached songs
        const { data: cachedSongs, error: cacheError } = await supabase
          .from('cached_songs')
          .select('*')
          .eq('artist_id', artistId)
          .order('popularity', { ascending: false });

        if (cacheError) {
          console.error('Error fetching cached songs:', cacheError);
          return [];
        }

        // If we have cached songs, return them
        if (cachedSongs && cachedSongs.length > 0) {
          console.log('Found cached songs:', cachedSongs.length);
          return cachedSongs;
        }

        // If no cached songs, fetch from Spotify
        console.log('No cached songs found, fetching from Spotify');
        const spotifyTracks = await getArtistTracks(accessToken, artistId);

        // Cache the tracks in our database
        const { data: insertedSongs, error: insertError } = await supabase
          .from('cached_songs')
          .insert(
            spotifyTracks.map(track => ({
              artist_id: artistId,
              name: track.name,
              platform_id: track.id,
              spotify_id: track.id,
              popularity: track.popularity || 0,
              preview_url: track.preview_url,
              album: track.album?.name
            }))
          )
          .select();

        if (insertError) {
          console.error('Error caching songs:', insertError);
          // Return Spotify tracks even if caching failed
          return spotifyTracks;
        }

        console.log('Successfully cached songs:', insertedSongs.length);
        return insertedSongs;
      } catch (error) {
        console.error('Error in useArtistSongs:', error);
        return [];
      }
    },
    enabled: !!artistId && !!accessToken,
  });
}
