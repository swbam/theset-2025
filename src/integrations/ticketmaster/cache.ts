import { supabase } from "../supabase/client";
import type { TicketmasterEvent, CachedShow, TicketmasterVenue } from "./types";

interface VenueCache {
  id?: string;
  ticketmaster_id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  last_synced_at: string;
}

async function updateVenuesCache(venues: TicketmasterVenue[]): Promise<Map<string, string>> {
  const venueMap = new Map<string, string>();
  
  if (venues.length === 0) return venueMap;

  try {
    const venuesToUpsert = venues.map(venue => ({
      ticketmaster_id: venue.id,
      name: venue.name,
      city: venue.city?.name || '',
      state: venue.state?.name,
      country: venue.country?.name,
      capacity: venue.capacity ? parseInt(venue.capacity) : undefined,
      last_synced_at: new Date().toISOString()
    }));

    const { data: upsertedVenues, error } = await supabase
      .from('venues')
      .upsert(venuesToUpsert, {
        onConflict: 'ticketmaster_id',
        returning: true
      });

    if (error) {
      console.error('Error upserting venues:', error);
      return venueMap;
    }

    // Map Ticketmaster IDs to our internal IDs
    upsertedVenues?.forEach((venue: VenueCache) => {
      if (venue.id && venue.ticketmaster_id) {
        venueMap.set(venue.ticketmaster_id, venue.id);
      }
    });

  } catch (error) {
    console.error('Error in updateVenuesCache:', error);
  }

  return venueMap;
}

function prepareShowForCache(show: TicketmasterEvent, artistId: string): CachedShow | null {
  try {
    const venue = show._embedded?.venues?.[0];
    if (!venue) return null;

    return {
      ticketmaster_id: show.id,
      artist_id: artistId,
      name: show.name,
      date: show.dates.start.dateTime,
      venue_name: venue.name,
      venue_location: venue.displayLocation || `${venue.city?.name || ''}, ${venue.state?.name || ''}`.trim(),
      ticket_url: show.url,
      status: show.dates?.status?.code || null,
      last_synced_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error preparing show for cache:', error);
    return null;
  }
}

export async function updateShowCache(shows: TicketmasterEvent[], artistId?: string | null) {
  if (shows.length === 0 || !artistId) {
    console.log('No shows or artist ID provided for caching');
    return;
  }

  console.log(`Processing ${shows.length} shows for caching`);

  try {
    // First, extract and upsert all venues
    const venues = shows
      .map(show => show._embedded?.venues?.[0])
      .filter((v): v is NonNullable<typeof v> => v !== undefined);

    const venueIds = await updateVenuesCache(venues);

    // Prepare shows for caching
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

    if (showsToCache.length === 0) {
      console.log('No valid shows to cache');
      return;
    }

    console.log(`Upserting ${showsToCache.length} shows to cache`);
    
    const { error: upsertError } = await supabase
      .from('cached_shows')
      .upsert(showsToCache, {
        onConflict: 'ticketmaster_id',
        returning: true
      });

    if (upsertError) {
      console.error('Error updating show cache:', upsertError);
    } else {
      console.log('Successfully cached shows:', showsToCache.map(s => s.ticketmaster_id));
    }
  } catch (error) {
    console.error('Error in updateShowCache:', error);
  }
}
