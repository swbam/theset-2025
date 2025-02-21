
import { supabase } from "../supabase/client";
import type { TicketmasterEvent } from "./types";

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    totalElements?: number;
    totalPages?: number;
    size?: number;
    number?: number;
  };
}

export async function callTicketmasterApi(
  endpoint: 'events' | 'search' | 'popularShows',
  params: Record<string, string> = {}
): Promise<TicketmasterResponse> {
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, params }
  });

  if (error) {
    console.error('Ticketmaster API error:', error);
    throw error;
  }

  return data;
}

export async function fetchPopularShows() {
  try {
    const now = new Date();
    const startDateTime = now.toISOString().split('.')[0] + 'Z';

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    const endDateTime = endDate.toISOString().split('.')[0] + 'Z';

    const response = await callTicketmasterApi('events', {
      startDateTime,
      endDateTime,
      sort: 'date,asc',
      size: '100',
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no'
    });

    const events = response._embedded?.events || [];
    
    // Get unique artists
    const uniqueArtists = new Map<string, TicketmasterEvent>();
    events.forEach(event => {
      const artist = event._embedded?.attractions?.[0];
      if (artist && !uniqueArtists.has(artist.name)) {
        uniqueArtists.set(artist.name, event);
      }
    });

    return Array.from(uniqueArtists.values());
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    throw error;
  }
}

export async function searchArtists(query: string) {
  if (!query?.trim()) return [];

  try {
    const now = new Date();
    const startDateTime = now.toISOString().split('.')[0] + 'Z';

    const response = await callTicketmasterApi('search', {
      q: query.trim(),
      startDateTime,
      sort: 'relevance,desc',
      size: '100'
    });

    const events = response._embedded?.events || [];
    
    // Get unique artists
    const uniqueArtists = new Map<string, TicketmasterEvent>();
    events.forEach(event => {
      const artist = event._embedded?.attractions?.[0];
      if (artist && !uniqueArtists.has(artist.name)) {
        uniqueArtists.set(artist.name, event);
      }
    });

    return Array.from(uniqueArtists.values());
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
}

export async function fetchArtistEvents(artistName: string) {
  if (!artistName?.trim()) return [];

  try {
    const now = new Date();
    const startDateTime = now.toISOString().split('.')[0] + 'Z';

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    const endDateTime = endDate.toISOString().split('.')[0] + 'Z';

    const response = await callTicketmasterApi('events', {
      keyword: artistName.trim(),
      startDateTime,
      endDateTime,
      sort: 'date,asc',
      size: '100'
    });

    const events = response._embedded?.events || [];

    // Filter to ensure we only get shows for this artist
    return events.filter(event => {
      const attractions = event._embedded?.attractions || [];
      return attractions.some(attraction => 
        attraction.name.toLowerCase() === artistName.toLowerCase()
      );
    });
  } catch (error) {
    console.error('Error fetching artist events:', error);
    throw error;
  }
}
