
import { supabase } from "../supabase/client";
import type { TicketmasterEvent } from "./types";
import { callTicketmasterApi } from "./api";

export const fetchPopularShows = async (): Promise<TicketmasterEvent[]> => {
  try {
    console.log('Fetching popular shows from Ticketmaster...');
    const response = await callTicketmasterApi('events', {
      size: '20',
      sort: 'relevance,desc',
      classificationName: 'music'
    });

    if (!response._embedded?.events) {
      console.warn('No events found in Ticketmaster response');
      return [];
    }

    return response._embedded.events;
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    throw error;
  }
};

export { updateShowCache } from './cache';
export { prepareShowForCache } from './showTransform';
