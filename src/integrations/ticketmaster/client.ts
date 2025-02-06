
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

const callTicketmasterFunction = async (endpoint: string, query?: string, params?: Record<string, string>) => {
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query, params },
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

  return Array.from(uniqueArtists.values()).sort((a, b) => b.capacity - a.capacity);
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);
  return callTicketmasterFunction('artist', artistName);
};

export const fetchUpcomingStadiumShows = async () => {
  console.log('Fetching upcoming stadium shows');
  return callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    segmentId: 'KZFzniwnSyZfZ7v7nJ'
  });
};

export const fetchLargeVenueShows = async () => {
  console.log('Fetching large venue shows');
  return callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    keyword: 'stadium,arena'
  });
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  return callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'popularity,desc',
    size: '20'
  });
};

