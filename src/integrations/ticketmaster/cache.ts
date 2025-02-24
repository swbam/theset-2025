
import { supabase } from "../supabase/client";
import type { TicketmasterEvent, TicketmasterVenue } from "./types";
import type { CachedShow } from "../supabase/types";

export async function updateVenueCache(venue: TicketmasterVenue): Promise<string | null> {
  if (!venue?.name || !venue?.id) {
    console.warn('Invalid venue data for caching:', venue);
    return null;
  }

  try {
    const venueData = {
      ticketmaster_id: venue.id,
      name: venue.name,
      city: venue.city?.name || '',
      state: venue.state?.name,
      country: venue.country?.name,
      capacity: venue.capacity ? parseInt(venue.capacity) : undefined,
      venue_image_url: venue.images?.[0]?.url,
      display_name: venue.displayName,
      display_location: venue.displayLocation
    };

    const { data: upsertedVenue, error } = await supabase
      .from('venues')
      .upsert(venueData)
      .select()
      .single();

    if (error) {
      console.error('Error upserting venue:', error);
      return null;
    }

    return upsertedVenue.id;
  } catch (error) {
    console.error('Error in updateVenueCache:', error);
    return null;
  }
}

export const prepareShowForCache = (
  show: TicketmasterEvent,
  artistId: string,
  venueId?: string
): Omit<CachedShow, 'id'> => {
  const venue = show._embedded?.venues?.[0];
  
  if (!venue) {
    console.warn('Show missing venue data:', show.id);
    throw new Error('Invalid show data: missing venue');
  }

  return {
    platform_id: show.id,
    artist_id: artistId,
    name: show.name,
    date: show.dates.start.dateTime,
    venue_id: venueId,
    venue_name: venue.name,
    venue_location: venue.displayLocation || `${venue.city?.name || ''}, ${venue.state?.name || ''}`.trim(),
    ticket_url: show.url,
    status: show.dates?.status?.code,
    ticketmaster_id: show.id,
    last_synced_at: new Date().toISOString()
  };
};

export async function updateShowCache(shows: TicketmasterEvent[], artistId: string) {
  if (!shows.length || !artistId) {
    console.log('No shows or artist ID provided for caching');
    return [];
  }

  const cachedShows: CachedShow[] = [];

  for (const show of shows) {
    const venue = show._embedded?.venues?.[0];
    if (!venue) continue;

    try {
      // Update venue cache first
      const venueId = await updateVenueCache(venue);
      if (!venueId) continue;

      // Prepare show data
      const showData = prepareShowForCache(show, artistId, venueId);

      const { data: cachedShow, error } = await supabase
        .from('cached_shows')
        .upsert(showData)
        .select(`
          *,
          venue:venues(*),
          artist:artists(*)
        `)
        .single();

      if (error) {
        console.error('Error caching show:', error);
        continue;
      }

      if (cachedShow) {
        cachedShows.push(cachedShow as CachedShow);
      }
    } catch (error) {
      console.error('Error in show cache update:', error);
    }
  }

  return cachedShows;
}
