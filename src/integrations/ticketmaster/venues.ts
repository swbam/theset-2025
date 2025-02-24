
import { supabase } from "../supabase/client";
import type { TicketmasterVenue } from "./types";
import type { CachedVenue } from "@/types/venue";
import { callTicketmasterApi } from "./api";

export const prepareVenueForCache = (venue: TicketmasterVenue): Omit<CachedVenue, 'id'> => {
  if (!venue?.name) {
    throw new Error('Invalid venue data');
  }

  return {
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
};

export const fetchVenueEvents = async (venueId: string, artistId: string) => {
  try {
    const response = await callTicketmasterApi('events', {
      venueId,
      sort: 'date,asc',
      size: '100'
    });
    
    const shows = response._embedded?.events || [];
    
    if (shows.length > 0) {
      const venue = shows[0]._embedded?.venues?.[0];
      if (venue) {
        const venueData = prepareVenueForCache(venue);
        const { data: upsertedVenue } = await supabase
          .from('venues')
          .upsert(venueData)
          .select()
          .single();

        if (upsertedVenue) {
          const showData = {
            artist_id: artistId,
            name: shows[0].name,
            date: shows[0].dates.start.dateTime,
            venue_id: upsertedVenue.id,
            venue_name: venue.name,
            venue_location: venue.displayLocation || `${venue.city?.name || ''}, ${venue.state?.name || ''}`.trim(),
            ticket_url: shows[0].url,
            platform_id: shows[0].id
          };

          await supabase
            .from('cached_shows')
            .upsert(showData);
        }
      }
    }

    return shows;
  } catch (error) {
    console.error('Error fetching venue events:', error);
    return [];
  }
};
