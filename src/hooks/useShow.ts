
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

      // Extract the actual Ticketmaster ID from the URL format
      const ticketmasterId = eventId.split('/').pop() || eventId;
      
      console.log('Fetching show:', ticketmasterId);
      
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
