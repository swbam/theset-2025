
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useShow(eventId: string | undefined) {
  return useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      if (!eventId) {
        console.error('No event ID provided');
        return null;
      }
      
      console.log('Fetching show with Ticketmaster ID:', eventId);
      
      const { data: show, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(*),
          artist:artists!cached_shows_artist_id_fkey(name)
        `)
        .eq('ticketmaster_id', eventId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      if (!show) {
        console.error('Show not found for ID:', eventId);
        return null;
      }

      console.log('Found show:', show);
      return show;
    },
    enabled: !!eventId,
  });
}
