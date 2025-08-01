import { supabase } from '@/integrations/supabase/client';
import { callTicketmasterFunction } from './api';
import type { CachedShow, TicketmasterEvent, TicketmasterVenue } from './types';
import { processArtist, processVenue, processShow } from './client';
import type { VenueLocation } from '@/types/show';
import type { Json } from '@/integrations/supabase/types';

// Convert TicketmasterVenue to VenueLocation for database storage
function mapVenueToLocation(venue: TicketmasterVenue): VenueLocation {
  return {
    city: venue.city ? { name: venue.city.name } : undefined,
    state: venue.state ? { 
      name: venue.state.name, 
      stateCode: venue.state.stateCode 
    } : undefined,
    country: venue.country ? { 
      name: venue.country.name, 
      countryCode: venue.country.countryCode 
    } : undefined,
    address: venue.address ? { line1: venue.address.line1 } : undefined,
  };
}

export async function cacheShowData(
  show: TicketmasterEvent,
  artistId: string
): Promise<CachedShow | null> {
  const venue = show._embedded?.venues?.[0];

  try {
    const { data, error } = await supabase
      .from('cached_shows')
      .upsert({
        ticketmaster_id: show.id,
        artist_id: artistId,
        name: show.name,
        date: show.dates.start.dateTime,
        venue_name: venue?.name,
        venue_location: venue ? (mapVenueToLocation(venue) as Json) : null,
        ticket_url: show.url,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching show:', error);
      return null;
    }

    return data as CachedShow;
  } catch (error) {
    console.error('Error caching show:', error);
    return null;
  }
}

export async function importToDatabase(show: TicketmasterEvent) {
  console.log('Importing show to database:', show.name);

  try {
    const artistData = show._embedded?.attractions?.[0];
    if (!artistData) {
      console.error('No artist data found for show:', show.name);
      return null;
    }

    const venueData = show._embedded?.venues?.[0];
    if (!venueData) {
      console.error('No venue data found for show:', show.name);
      return null;
    }

    const artistId = await processArtist(artistData);
    if (!artistId) {
      console.error('Failed to process artist:', artistData.name);
      return null;
    }

    // Cache the show data for quicker access
    const cachedShow = await cacheShowData(show, artistId);
    if (!cachedShow) {
      console.error('Failed to cache show data:', show.name);
    }

    const venueId = await processVenue(venueData);
    if (!venueId) {
      console.error('Failed to process venue:', venueData.name);
      return null;
    }

    const showId = await processShow(show, artistId, venueId);
    if (!showId) {
      console.error('Failed to process show:', show.name);
      return null;
    }

    return showId;
  } catch (error) {
    console.error('Error importing show to database:', error);
    return null;
  }
}

export const prepareShowForCache = (
  show: TicketmasterEvent,
  artistId?: string | null
): CachedShow | null => {
  if (!show.dates?.start?.dateTime) {
    return null;
  }

  const venue = show._embedded?.venues?.[0];

  return {
    id: crypto.randomUUID(),
    ticketmaster_id: show.id,
    artist_id: artistId || '',
    name: show.name,
    date: show.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue ? mapVenueToLocation(venue) : undefined,
    ticket_url: show.url,
    last_synced_at: new Date().toISOString(),
  };
};

export const updateShowCache = async (
  shows: TicketmasterEvent[],
  artistId?: string | null
) => {
  if (shows.length === 0) return;

  console.log('Caching shows:', shows.length);

  // First, extract and upsert all venues
  const venues = shows
    .map((show) => show._embedded?.venues?.[0])
    .filter((v): v is NonNullable<typeof v> => v !== undefined);

  // Note: Venue cache update would be handled here

  // Prepare and upsert shows
  const showsToCache = shows
    .map((show) => prepareShowForCache(show, artistId))
    .filter((s): s is CachedShow => s !== null);

  if (showsToCache.length > 0) {
    console.log('Upserting shows to cache:', showsToCache.length);

    for (const show of showsToCache) {
      const { error: upsertError } = await supabase
        .from('cached_shows')
        .upsert(show, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false,
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
    segmentId: 'KZFzniwnSyZfZ7v7nJ',
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
    keyword: 'stadium,arena',
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
    size: '100',
  });

  if (shows.length > 0) {
    await updateShowCache(shows);
  }

  return shows;
};
