
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistEvents } from "@/integrations/ticketmaster/api";
import { updateShowCache } from "@/integrations/ticketmaster/cache";

export function useShow(eventId: string | undefined) {
  return useQuery({
    queryKey: ['show', eventId],
    queryFn: async () => {
      if (!eventId) {
        console.error('No event ID provided');
        return null;
      }
      
      console.log('Fetching show with Ticketmaster ID:', eventId);
      
      // First try to get from cache
      const { data: cachedShow, error } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(*),
          artist:artists(*)
        `)
        .eq('platform_id', eventId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching show:', error);
        return null;
      }

      if (cachedShow) {
        console.log('Found cached show:', cachedShow);
        return cachedShow;
      }

      // If not in cache, fetch from Ticketmaster
      console.log('Show not found in cache, fetching from Ticketmaster...');
      const response = await fetchArtistEvents(eventId);
      const ticketmasterShow = response.find(show => show.id === eventId);

      if (!ticketmasterShow) {
        console.error('Show not found in Ticketmaster');
        return null;
      }

      // Get artist from ticketmaster show
      const artist = ticketmasterShow._embedded?.attractions?.[0];
      if (!artist) {
        console.error('No artist found in show data');
        return null;
      }

      // Find or create artist
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('name', artist.name)
        .maybeSingle();

      if (!existingArtist) {
        console.log('Creating new artist:', artist.name);
        const { data: newArtist, error: artistError } = await supabase
          .from('artists')
          .insert({
            name: artist.name,
            ticketmaster_id: artist.id,
            image_url: artist.images?.[0]?.url
          })
          .select()
          .single();

        if (artistError || !newArtist) {
          console.error('Error creating artist:', artistError);
          return null;
        }

        // Cache the show with the new artist
        const cachedShows = await updateShowCache([ticketmasterShow], newArtist.id);
        if (cachedShows.length > 0) {
          const { data: fullShow } = await supabase
            .from('cached_shows')
            .select(`
              *,
              venue:venues(*),
              artist:artists(*)
            `)
            .eq('platform_id', eventId)
            .maybeSingle();

          return fullShow;
        }
      } else {
        // Cache the show with existing artist
        const cachedShows = await updateShowCache([ticketmasterShow], existingArtist.id);
        if (cachedShows.length > 0) {
          const { data: fullShow } = await supabase
            .from('cached_shows')
            .select(`
              *,
              venue:venues(*),
              artist:artists(*)
            `)
            .eq('platform_id', eventId)
            .maybeSingle();

          return fullShow;
        }
      }

      return null;
    },
    enabled: !!eventId,
  });
}
