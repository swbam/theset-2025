
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

export const fetchUpcomingStadiumShows = async (artistId?: string) => {
  try {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    const shows = await callTicketmasterFunction('events', undefined, {
      classificationName: 'music',
      size: '20',
      sort: 'date,asc',
      segmentId: 'KZFzniwnSyZfZ7v7nJ',
      includeTBA: 'no',
      includeTBD: 'no',
      includeTest: 'no',
      marketId: '102',
      localStartEndDateTime: `${startDate},${endDate}`
    });

    // Filter to only include music events in large venues
    const filteredShows = shows.filter((show: TicketmasterEvent) => {
      const venue = show._embedded?.venues?.[0];
      const isMusic = show._embedded?.attractions?.some(attr => 
        attr.classifications?.some(c => c.segment?.name.toLowerCase() === 'music')
      );
      const hasValidArtist = show._embedded?.attractions?.some(attr => attr.name && attr.id);
      const capacity = venue?.capacity ? parseInt(venue.capacity) : 0;
      
      return isMusic && hasValidArtist && capacity > 15000;
    });

    if (filteredShows.length > 0) {
      await updateShowCache(filteredShows, artistId);
    }

    return filteredShows;
  } catch (error) {
    console.error('Error fetching stadium shows:', error);
    return [];
  }
};

export const fetchLargeVenueShows = async (artistId?: string) => {
  try {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    
    const shows = await callTicketmasterFunction('events', undefined, {
      classificationName: 'music',
      size: '20',
      sort: 'date,asc',
      segmentId: 'KZFzniwnSyZfZ7v7nJ',
      includeTBA: 'no',
      includeTBD: 'no',
      includeTest: 'no',
      marketId: '102',
      localStartEndDateTime: `${startDate},${endDate}`
    });

    const filteredShows = shows.filter((show: TicketmasterEvent) => {
      const isMusic = show._embedded?.attractions?.some(attr => 
        attr.classifications?.some(c => c.segment?.name.toLowerCase() === 'music')
      );
      const hasValidArtist = show._embedded?.attractions?.some(attr => attr.name && attr.id);
      
      return isMusic && hasValidArtist;
    });

    if (filteredShows.length > 0) {
      await updateShowCache(filteredShows, artistId);
    }

    return filteredShows;
  } catch (error) {
    console.error('Error fetching venue shows:', error);
    return [];
  }
};

export const fetchPopularTours = async (artistId?: string) => {
  try {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    
    const shows = await callTicketmasterFunction('events', undefined, {
      classificationName: 'music',
      sort: 'relevance,desc',
      size: '100',
      segmentId: 'KZFzniwnSyZfZ7v7nJ',
      includeTBA: 'no',
      includeTBD: 'no',
      includeTest: 'no',
      marketId: '102',
      localStartEndDateTime: `${startDate},${endDate}`
    });

    const filteredShows = shows.filter((show: TicketmasterEvent) => {
      const isMusic = show._embedded?.attractions?.some(attr => 
        attr.classifications?.some(c => c.segment?.name.toLowerCase() === 'music')
      );
      const hasValidArtist = show._embedded?.attractions?.some(attr => attr.name && attr.id);
      
      return isMusic && hasValidArtist;
    });

    if (filteredShows.length > 0) {
      await updateShowCache(filteredShows, artistId);
    }

    return filteredShows;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};
