
import { supabase } from "@/integrations/supabase/client";
import { callTicketmasterFunction } from "./api";
import type { TicketmasterVenue, CachedVenue } from "./types";

export const prepareVenueForCache = (venue: TicketmasterVenue): CachedVenue | null => {
  if (!venue?.name) {
    return null;
  }

  return {
    ticketmaster_id: venue.id,
    name: venue.name,
    city: venue.city?.name,
    state: venue.state?.name,
    country: venue.country?.name,
    address: venue.address?.line1,
    location: venue,
    capacity: venue.capacity,
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

  const venuesToCache = venues
    .map(prepareVenueForCache)
    .filter((v): v is CachedVenue => v !== null);

  if (venuesToCache.length > 0) {
    const { error: venueError } = await supabase
      .from('venues')
      .upsert(venuesToCache, {
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false
      });

    if (venueError) {
      console.error('Error updating venue cache:', venueError);
      return new Map<string, string>();
    }
  }

  // Get venue IDs map
  const venueIds = new Map<string, string>();
  for (const venue of venuesToCache) {
    const { data: venueData } = await supabase
      .from('venues')
      .select('id, ticketmaster_id')
      .eq('ticketmaster_id', venue.ticketmaster_id)
      .single();
    
    if (venueData) {
      venueIds.set(venue.ticketmaster_id, venueData.id);
    }
  }

  return venueIds;
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
      venue_id: venueIds.get(show._embedded?.venues?.[0]?.id || ''),
      venue_name: show._embedded?.venues?.[0]?.name,
      venue_location: show._embedded?.venues?.[0],
      ticket_url: show.url,
      last_synced_at: new Date().toISOString()
    }));

    if (showsToCache.length > 0) {
      const { error: showsError } = await supabase
        .from('cached_shows')
        .upsert(showsToCache, {
          onConflict: 'ticketmaster_id',
          ignoreDuplicates: false
        });

      if (showsError) {
        console.error('Error updating shows cache:', showsError);
      }
    }
  }

  return shows;
};

