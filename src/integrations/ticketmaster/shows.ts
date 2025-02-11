import { supabase } from "@/integrations/supabase/client";
import { callTicketmasterFunction } from "./api";
import { updateVenuesCache } from "./venues";
import type { TicketmasterEvent, CachedShow } from "./types";

export const prepareShowForCache = (show: TicketmasterEvent, artistId?: string | null): Omit<CachedShow, 'venue_id'> | null => {
  if (!show.dates?.start?.dateTime || !artistId) {
    console.log('Skipping show cache - missing required data:', show.id);
    return null;
  }

  const venue = show._embedded?.venues?.[0];
  
  return {
    id: show.id,
    ticketmaster_id: show.id,
    artist_id: artistId,
    name: show.name,
    date: show.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue ? JSON.stringify(venue) : null,
    ticket_url: show.url,
    status: show.dates?.status?.code || null,
    price_ranges: show.priceRanges ? JSON.stringify(show.priceRanges) : null,
    last_synced_at: new Date().toISOString()
  };
};

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

const formatDateRange = (startDate: Date, endDate: Date): string => {
  // Ensure dates have UTC timezone (Z suffix)
  return `${startDate.toISOString().replace('.000', '')},${endDate.toISOString().replace('.000', '')}`;
};

export const fetchUpcomingStadiumShows = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
  } catch (error) {
    console.error('Error fetching stadium shows:', error);
    return [];
  }
};

export const fetchLargeVenueShows = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
  } catch (error) {
    console.error('Error fetching venue shows:', error);
    return [];
  }
};

export const fetchPopularTours = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};
