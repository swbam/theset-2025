
import { supabase } from "../supabase/client";
import type { TicketmasterEvent } from "./types";
import { callTicketmasterApi } from "./api";

export const fetchPopularShows = async (): Promise<TicketmasterEvent[]> => {
  try {
    console.log('Fetching popular shows from Ticketmaster...');
    const response = await callTicketmasterApi('events', {
      size: '20',
      sort: 'date,asc',
      classificationName: 'music'
    });

    if (!response._embedded?.events) {
      console.warn('No events found in Ticketmaster response');
      return [];
    }

    const events = response._embedded.events;
    
    // Filter for valid events and deduplicate by artist
    const artistShows = new Map<string, TicketmasterEvent>();
    events.forEach(event => {
      const artist = event._embedded?.attractions?.[0];
      if (artist?.name && 
          event._embedded?.venues?.[0]?.name && 
          event.dates?.start?.dateTime) {
        artistShows.set(artist.name, event);
      }
    });

    return Array.from(artistShows.values());
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    // Re-throw so the UI can handle the error appropriately
    throw error;
  }
};
