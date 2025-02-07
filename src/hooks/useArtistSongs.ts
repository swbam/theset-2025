
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SpotifyTrack } from "@/integrations/spotify/client";

const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export function useArtistSongs(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist-songs', artistId],
    queryFn: async () => {
      if (!artistId) return [];

      // First check if we have cached songs that are still fresh
      const { data: cachedSongs, error: cacheError } = await supabase
        .from('cached_songs')
        .select('*')
        .eq('artist_id', artistId)
        .order('name', { ascending: true });

      if (cacheError) {
        console.error('Error fetching cached songs:', cacheError);
      }

      if (cachedSongs && cachedSongs.length > 0) {
        const lastSyncedAt = new Date(cachedSongs[0].last_synced_at);
        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
        
        // If songs were cached less than 24 hours ago, return them
        if (hoursSinceLastSync < 24) {
          return cachedSongs;
        }
      }

      // If no cached songs or cache is stale, fetch and cache songs
      // We'll use the secrets table to get the Spotify API key
      const { data: secrets } = await supabase
        .from('secrets')
        .select('value')
        .eq('key', 'SPOTIFY_ACCESS_TOKEN')
        .single();

      if (!secrets?.value) {
        console.error('No Spotify access token found');
        return [];
      }

      // Get the artist's Spotify ID from the artists table
      const { data: artist } = await supabase
        .from('artists')
        .select('spotify_id')
        .eq('id', artistId)
        .single();

      if (!artist?.spotify_id) {
        console.error('No Spotify ID found for artist');
        return [];
      }

      try {
        // Fetch tracks from Spotify
        const response = await fetch(`${SPOTIFY_API_URL}/artists/${artist.spotify_id}/top-tracks?market=US`, {
          headers: {
            Authorization: `Bearer ${secrets.value}`,
          },
        });
        const data = await response.json();
        const tracks: SpotifyTrack[] = data.tracks || [];

        // Cache the tracks in the database
        if (tracks.length > 0) {
          const songsToCache = tracks.map(track => ({
            spotify_id: track.id,
            name: track.name,
            artist_id: artistId,
            album: track.album.name,
            popularity: track.popularity,
            preview_url: track.preview_url,
          }));

          // First delete old cached songs for this artist
          await supabase
            .from('cached_songs')
            .delete()
            .eq('artist_id', artistId);

          // Then insert new ones
          const { error: insertError } = await supabase
            .from('cached_songs')
            .insert(songsToCache);

          if (insertError) {
            console.error('Error caching songs:', insertError);
          }

          return songsToCache;
        }

        return [];
      } catch (error) {
        console.error('Error fetching songs from Spotify:', error);
        return cachedSongs || [];
      }
    },
    enabled: !!artistId,
  });
}
