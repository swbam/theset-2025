
import { supabase } from "@/integrations/supabase/client";

export interface TicketmasterEvent {
  name: string;
  dates: {
    start: {
      dateTime: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      capacity?: number;
      city?: {
        name: string;
      };
      state?: {
        name: string;
      };
    }>;
    attractions?: Array<{
      name: string;
      images?: Array<{
        url: string;
      }>;
      classifications?: Array<{
        primary: boolean;
        segment: {
          name: string;
        };
      }>;
    }>;
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
  url: string;
  classifications?: Array<{
    primary: boolean;
    segment: {
      name: string;
    };
  }>;
}

const callTicketmasterFunction = async (endpoint: string, query?: string) => {
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query },
  });

  if (error) {
    console.error('Error calling Ticketmaster function:', error);
    throw error;
  }

  return data?._embedded?.events || [];
};

export const searchArtists = async (query: string) => {
  console.log('Searching for artists:', query);
  const results = await callTicketmasterFunction('search', query);
  
  // Filter for music events and remove duplicates
  const uniqueArtists = new Map();
  
  results.forEach((event: TicketmasterEvent) => {
    const artist = event._embedded?.attractions?.[0];
    if (artist && artist.name) {
      if (!uniqueArtists.has(artist.name)) {
        uniqueArtists.set(artist.name, {
          name: artist.name,
          image: artist.images?.[0]?.url || event.images?.[0]?.url,
          venue: event._embedded?.venues?.[0]?.name,
          date: event.dates.start.dateTime,
          url: event.url,
          capacity: event._embedded?.venues?.[0]?.capacity || 0
        });
      }
    }
  });

  // Convert to array and sort by venue capacity (as a proxy for popularity)
  return Array.from(uniqueArtists.values()).sort((a, b) => b.capacity - a.capacity);
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);
  return callTicketmasterFunction('artist', artistName);
};

export const fetchFeaturedShows = async () => {
  console.log('Fetching featured shows');
  const results = await callTicketmasterFunction('featured');
  
  // Filter for unique artists and large venues
  const uniqueArtistShows = new Map();
  
  results.forEach((event: TicketmasterEvent) => {
    const artist = event._embedded?.attractions?.[0];
    const venue = event._embedded?.venues?.[0];
    const capacity = venue?.capacity || 0;
    
    // Only include shows in larger venues (proxy for stadium/arena shows)
    if (artist && venue && capacity > 5000) {
      if (!uniqueArtistShows.has(artist.name)) {
        uniqueArtistShows.set(artist.name, event);
      }
    }
  });

  return Array.from(uniqueArtistShows.values());
};
