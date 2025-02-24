
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Setlist } from "@/types/setlist";

export function useSetlist(showId: string | undefined, user: User | null) {
  return useQuery({
    queryKey: ['setlist', showId],
    queryFn: async () => {
      if (!showId) {
        console.log('No show ID provided');
        return null;
      }

      console.log('Fetching setlist for show:', showId);
      
      const { data: setlist, error } = await supabase
        .from('setlists')
        .select(`
          *,
          show:shows(
            *,
            artist:artists(*),
            venue:venues(*)
          )
        `)
        .eq('show_id', showId)
        .single();
        
      if (error) {
        console.error('Error fetching setlist:', error);
        throw error;
      }

      return setlist as Setlist;
    },
    enabled: !!showId
  });
}
