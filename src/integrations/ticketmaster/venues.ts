
import { supabase } from "@/integrations/supabase/client";
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
