import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterVenue, CachedVenue } from "./types";
import { callTicketmasterFunction } from "./api";

export const prepareVenueForCache = (venue: TicketmasterVenue): CachedVenue | null => {
  if (!venue?.name) {
    return null;
  }

  // Get the best venue image if available
  const venueImage = venue.images?.find(img => 
    img.ratio === "16_9" || img.ratio === "4_3"
  )?.url;

  return {
    ticketmaster_id: venue.id,
    name: venue.name,
    city: venue.city?.name || '',
    state: venue.state?.name,
    country: venue.country?.name,
    address: venue.address?.line1,
    location: venue,
    capacity: venue.capacity,
    venue_image_url: venueImage || null,
    last_synced_at: new Date().toISOString()
  };
};

export const fetchVenueFromCache = async (venueId: string | null, ttlHours = 24) => {
  if (!venueId) return null;
  
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('ticketmaster_id', venueId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching venue from cache:', error);
    return null;
  }

  if (!venue) return null;

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_venue_refresh', { 
      last_sync: venue.last_synced_at,
      ttl_hours: ttlHours 
    });

  return needsRefresh ? null : venue;
};

export const updateVenuesCache = async (venues: TicketmasterVenue[]) => {
  if (venues.length === 0) return new Map<string, string>();

  // Deduplicate venues using a Map with ticketmaster_id as key
  const uniqueVenues = new Map<string, TicketmasterVenue>();
  venues.forEach(venue => {
    if (venue && venue.id) {
      uniqueVenues.set(venue.id, venue);
    }
  });

  // Convert unique venues to cache format
  const venuesToCache = Array.from(uniqueVenues.values())
    .map(prepareVenueForCache)
    .filter((v): v is CachedVenue => v !== null);

  if (venuesToCache.length > 0) {
    console.log(`Upserting ${venuesToCache.length} unique venues`);
    const { data: upsertedVenues, error: venueError } = await supabase
      .from('venues')
      .upsert(venuesToCache)
      .select('id, ticketmaster_id');

    if (venueError) {
      console.error('Error updating venue cache:', venueError);
      return new Map<string, string>();
    }

    // Create venue IDs map from upserted venues
    const venueIds = new Map<string, string>();
    if (upsertedVenues) {
      upsertedVenues.forEach(venue => {
        venueIds.set(venue.ticketmaster_id, venue.id);
      });
    }
    return venueIds;
  }

  return new Map<string, string>();
};

export const fetchVenueEvents = async (venueId: string) => {
  console.log('Fetching events for venue:', venueId);
  
  const cachedVenue = await fetchVenueFromCache(venueId);
  if (cachedVenue) {
    console.log('Found cached venue data');
    const { data: shows } = await supabase
      .from('cached_shows')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('venue_id', cachedVenue.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });
      
    if (shows && shows.length > 0) {
      console.log('Returning cached shows for venue');
      return shows;
    }
  }

  console.log('Fetching fresh venue data from Ticketmaster');
  const shows = await callTicketmasterFunction('venue', venueId);
  
  if (shows.length > 0) {
    const venues = shows
      .map(show => show._embedded?.venues?.[0])
      .filter((v): v is NonNullable<typeof v> => v !== undefined);
    
    const venueIds = await updateVenuesCache(venues);
    
    // Update shows cache with venue IDs
    const showsToCache = shows.map(show => ({
      ticketmaster_id: show.id,
      name: show.name,
      date: show.dates.start.dateTime,
      venue_id: show._embedded?.venues?.[0]?.id ? venueIds.get(show._embedded.venues[0].id) : null,
      venue_name: show._embedded?.venues?.[0]?.name,
      venue_location: show._embedded?.venues?.[0],
      ticket_url: show.url,
      last_synced_at: new Date().toISOString()
    }));

    if (showsToCache.length > 0) {
      const { error: showsError } = await supabase
        .from('cached_shows')
        .upsert(showsToCache, {
          onConflict: 'ticketmaster_id'
        });

      if (showsError) {
        console.error('Error updating shows cache:', showsError);
      }
    }
  }

  return shows;
};
