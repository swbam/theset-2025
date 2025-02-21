
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
  try {
    console.log('Calling Ticketmaster API:', endpoint, params);
    const { data, error } = await supabase.functions.invoke('ticketmaster', {
      body: { endpoint, params }
    });

    if (error) {
      console.error('Ticketmaster API error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in callTicketmasterApi:', error);
    throw error;
  }
}

export async function searchArtists(query: string) {
  if (!query?.trim()) return [];

  try {
    const response = await callTicketmasterApi('search', {
      keyword: query.trim(),
      size: '100'
    });

    return response._embedded?.events || [];
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
}

export async function fetchArtistEvents(artistName: string) {
  if (!artistName?.trim()) return [];

  try {
    const response = await callTicketmasterApi('events', {
      keyword: artistName.trim(),
      size: '100'
    });

    return response._embedded?.events || [];
  } catch (error) {
    console.error('Error fetching artist events:', error);
    throw error;
  }
}
