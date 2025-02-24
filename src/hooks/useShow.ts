
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Show } from "@/types/show";

export function useShow(showId: string | undefined) {
  return useQuery({
    queryKey: ['show', showId],
    queryFn: async () => {
      if (!showId) {
        console.error('No show ID provided');
        return null;
      }
      
      console.log('Fetching show:', showId);
      
      const { data: show, error } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(*),
          venue:venues(*),
          setlist:setlists(*)
        `)
        .eq('ticketmaster_id', showId)
        .single();
      
      if (error) {
        console.error('Error fetching show:', error);
        throw error;
      }

      return show as Show;
    },
    enabled: !!showId,
  });
}
