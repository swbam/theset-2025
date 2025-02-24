
import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterEvent, CachedShow } from "./types";
import { prepareShowForCache } from "./showTransform";
import { updateVenuesCache } from "./venues";

export const updateShowCache = async (shows: TicketmasterEvent[], artistId?: string | null) => {
  if (shows.length === 0 || !artistId) return;

  console.log('Processing shows for caching:', shows.length);

  try {
    // First, extract and upsert all venues
    const venues = shows
      .map(show => show._embedded?.venues?.[0])
      .filter((v): v is NonNullable<typeof v> => v !== undefined);

    const venueIds = await updateVenuesCache(venues);

    // Only prepare shows that have an artist ID
    const showsToCache = shows
      .map(show => {
        const prepared = prepareShowForCache(show, artistId);
        if (!prepared) return null;

        const venueId = show._embedded?.venues?.[0]?.id;
        if (venueId) {
          return {
            ...prepared,
            venue_id: venueIds.get(venueId) || null
          };
        }

        return prepared;
      })
      .filter((s): s is CachedShow => s !== null);

    if (showsToCache.length > 0) {
      console.log('Upserting shows to cache:', showsToCache.length);
      
      const { error: upsertError } = await supabase
        .from('cached_shows')
        .upsert(showsToCache, {
          onConflict: 'ticketmaster_id'
        });

      if (upsertError) {
        console.error('Error updating show cache:', upsertError);
      } else {
        console.log('Successfully cached shows:', showsToCache.map(s => s.ticketmaster_id));
      }
    }
  } catch (error) {
    console.error('Error in updateShowCache:', error);
  }
};
