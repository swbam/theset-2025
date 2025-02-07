
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useShow(eventPath: string | undefined) {
  return useQuery({
    queryKey: ['show', eventPath],
    queryFn: async () => {
      if (!eventPath) {
        console.error('No event path provided');
        return null;
      }

      // Extract Ticketmaster ID from the URL - now it's just after 'event/'
      const ticketmasterId = eventPath.split('/').pop();
      
      if (!ticketmasterId) {
        console.error('Invalid event URL format:', eventPath);
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
    enabled: !!eventPath,
  });
}
