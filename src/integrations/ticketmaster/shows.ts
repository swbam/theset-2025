import { supabase } from "@/integrations/supabase/client";
import { callTicketmasterFunction } from "./api";
import { updateVenuesCache } from "./venues";
import type { TicketmasterEvent, CachedShow } from "./types";

export const prepareShowForCache = (show: TicketmasterEvent, artistId?: string | null): CachedShow | null => {
  if (!show.dates?.start?.dateTime) {
    return null;
  }

  const venue = show._embedded?.venues?.[0];
  
  return {
    ticketmaster_id: show.id,
    artist_id: artistId || null,
    name: show.name,
    date: show.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue ? JSON.stringify(venue) : null,
    ticket_url: show.url,
    last_synced_at: new Date().toISOString()
  };
};

export const updateShowCache = async (shows: TicketmasterEvent[], artistId?: string | null) => {
  if (shows.length === 0) return;

  console.log('Caching shows:', shows.length);

  // First, extract and upsert all venues
  const venues = shows
    .map(show => show._embedded?.venues?.[0])
    .filter((v): v is NonNullable<typeof v> => v !== undefined);

  const venueIds = await updateVenuesCache(venues);

  // Prepare and upsert shows with venue IDs
  const showsToCache = shows
    .map(show => {
      const prepared = prepareShowForCache(show, artistId);
      if (!prepared) return null;

      const venueId = show._embedded?.venues?.[0]?.id;
      if (venueId) {
        prepared.venue_id = venueIds.get(venueId);
      }

      return prepared;
    })
    .filter((s): s is CachedShow => s !== null);

  if (showsToCache.length > 0) {
    console.log('Upserting shows to cache:', showsToCache.length);
    
    for (const show of showsToCache) {
      const { error: upsertError } = await supabase
        .from('cached_shows')
        .upsert(show, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error updating show cache:', upsertError, show);
      }
    }
  }
};

export const fetchUpcomingStadiumShows = async () => {
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    segmentId: 'KZFzniwnSyZfZ7v7nJ'
  });

  if (shows.length > 0) {
    await updateShowCache(shows);
  }

  return shows;
};

export const fetchLargeVenueShows = async () => {
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    keyword: 'stadium,arena'
  });

  if (shows.length > 0) {
    await updateShowCache(shows);
  }

  return shows;
};

export const fetchPopularTours = async () => {
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'relevance,desc',
    size: '100'
  });

  if (shows.length > 0) {
    await updateShowCache(shows);
  }

  return shows;
};
