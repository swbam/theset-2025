
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

      // Get the Ticketmaster ID from the last segment after 'event/'
      const ticketmasterId = eventId.split('event/').pop();
      
      if (!ticketmasterId) {
        console.error('Invalid event URL format');
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
        console.error('Show not found:', ticketmasterId);
        return null;
      }

      return show;
    },
    enabled: !!eventId,
  });
}
