
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Show } from "@/types/show";

export function useArtistShows(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artistShows', artistId],
    queryFn: async () => {
      if (!artistId) {
        console.error('No artist ID provided');
        return [];
      }

      console.log('Fetching shows for artist:', artistId);

      const { data: shows, error } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(*),
          venue:venues(*),
          setlist:setlists(*)
        `)
        .eq('artist_id', artistId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching shows:', error);
        throw error;
      }

      return shows as Show[];
    },
    enabled: !!artistId
  });
}
