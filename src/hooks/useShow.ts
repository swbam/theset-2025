
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useShow(eventId: string | undefined) {
  return useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      console.log('Fetching show:', eventId);
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
        .eq('ticketmaster_id', eventId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      if (!show) {
        console.error('Show not found:', eventId);
        return null;
      }

      return show;
    },
    enabled: !!eventId,
  });
}
