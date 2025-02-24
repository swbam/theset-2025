
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useArtistSongs(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist-songs', artistId],
    queryFn: async () => {
      if (!artistId) return [];

      console.log('Fetching songs for artist:', artistId);

      // Get cached songs for the artist
      const { data: songs, error } = await supabase
        .from('cached_songs')
        .select('*')
        .eq('artist_id', artistId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching artist songs:', error);
        return [];
      }

      console.log('Found songs for artist:', songs?.length);
      return songs || [];
    },
    enabled: !!artistId,
  });
}
