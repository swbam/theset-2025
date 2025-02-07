
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

      // Extract Ticketmaster ID from the URL - it's the last part after 'event/'
      const match = eventId.match(/event\/([^/]+)$/);
      const ticketmasterId = match ? match[1] : null;
      
      if (!ticketmasterId) {
        console.error('Invalid event URL format:', eventId);
        return null;
      }
      
      console.log('Fetching show with Ticketmaster ID:', ticketmasterId);
      
      const { data: show, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('ticketmaster_id', ticketmasterId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      if (!show) {
        console.error('Show not found for ID:', ticketmasterId);
        return null;
      }

      console.log('Found show:', show);
      return show;
    },
    enabled: !!eventId,
  });
}
