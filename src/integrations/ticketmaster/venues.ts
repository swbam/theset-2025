
import { supabase } from "../supabase/client";
import type { TicketmasterVenue, CachedVenue } from "./types";
import { callTicketmasterApi } from "./api";

export const prepareVenueForCache = (venue: TicketmasterVenue): CachedVenue | null => {
  if (!venue?.name) {
    return null;
  }

  // Get the best venue image if available
  const venueImage = venue.images?.find(img => 
    img.ratio === "16_9" || img.ratio === "4_3"
  )?.url;

  return {
    id: venue.id,
    ticketmaster_id: venue.id,
    name: venue.name,
    city: venue.city?.name || '',
    state: venue.state?.name,
    country: venue.country?.name,
    capacity: venue.capacity ? parseInt(venue.capacity) : undefined,
    venue_image_url: venueImage || null,
    last_synced_at: new Date().toISOString(),
    displayName: venue.displayName,
    displayLocation: venue.displayLocation
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
  try {
    const response = await callTicketmasterApi(`venues/${venueId}/events`);
    const shows = response._embedded?.events || [];
    
    if (shows.length > 0) {
      // Update venue cache first
      const venue = shows[0]._embedded?.venues?.[0];
      if (venue) {
        const preparedVenue = prepareVenueForCache(venue);
        if (preparedVenue) {
          const { data: upsertedVenue } = await supabase
            .from('venues')
            .upsert(preparedVenue)
            .select()
            .single();

          if (upsertedVenue) {
            // Now update shows with the venue reference
            await Promise.all(shows.map(async (show) => {
              const showData = {
                ticketmaster_id: show.id,
                name: show.name,
                date: show.dates.start.dateTime,
                venue_id: upsertedVenue.id,
                venue_name: venue.name,
                venue_location: venue.displayLocation || `${venue.city?.name || ''}, ${venue.state?.name || ''}`.trim(),
                ticket_url: show.url,
                last_synced_at: new Date().toISOString(),
                platform_id: show.id
              };

              await supabase
                .from('cached_shows')
                .upsert(showData);
            }));
          }
        }
      }
    }

    return shows;
  } catch (error) {
    console.error('Error fetching venue events:', error);
    return [];
  }
};
