
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { supabase } from "@/integrations/supabase/client";

export const useArtistShows = (normalizedArtistName: string, artistId: string | undefined) => {
  return useQuery({
    queryKey: ['artistShows', normalizedArtistName, artistId],
    queryFn: async () => {
      console.log('Fetching shows for artist:', normalizedArtistName, 'with ID:', artistId);

      if (!artistId) {
        console.error('No artist ID provided');
        return [];
      }

      // First try to get cached shows
      const { data: cachedShows, error: cachedError } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(*),
          artist:artists!cached_shows_artist_id_fkey(*)
        `)
        .eq('artist_id', artistId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (cachedError) {
        console.error('Error fetching cached shows:', cachedError);
      }

      if (cachedShows && cachedShows.length > 0) {
        console.log('Found cached shows:', cachedShows.length);
        return cachedShows;
      }

      // If no cached shows, fetch from Ticketmaster
      console.log('No cached shows found, fetching from Ticketmaster');
      const response = await fetchArtistEvents(normalizedArtistName);
      return response;
    },
    enabled: !!normalizedArtistName && !!artistId,
  });
};
