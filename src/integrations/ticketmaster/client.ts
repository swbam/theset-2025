
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
    }>;
    attractions?: Array<{
      name: string;
      images?: Array<{
        url: string;
      }>;
    }>;
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
  url: string;
}

const callTicketmasterFunction = async (endpoint: string, query?: string) => {
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query },
  });

  if (error) throw error;
  return data?._embedded?.events || [];
};

export const searchArtists = async (query: string) => {
  return callTicketmasterFunction('search', query);
};

export const fetchArtistEvents = async (artistName: string) => {
  return callTicketmasterFunction('artist', artistName);
};

export const fetchFeaturedShows = async () => {
  return callTicketmasterFunction('featured');
};
