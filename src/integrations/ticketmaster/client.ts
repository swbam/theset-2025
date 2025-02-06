
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

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
    }>;
  };
  images?: Array<{
    url: string;
    ratio?: string;
  }>;
  url: string;
}

export const searchArtists = async (query: string) => {
  const { data: { TICKETMASTER_API_KEY } } = await supabase
    .from('secrets')
    .select('TICKETMASTER_API_KEY')
    .single();

  if (!TICKETMASTER_API_KEY) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(query)}&apikey=${TICKETMASTER_API_KEY}`
  );
  const data = await response.json();
  return data?._embedded?.events || [];
};

export const fetchFeaturedShows = async () => {
  const { data: { TICKETMASTER_API_KEY } } = await supabase
    .from('secrets')
    .select('TICKETMASTER_API_KEY')
    .single();

  if (!TICKETMASTER_API_KEY) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?classificationName=music&sort=date,asc&size=3&apikey=${TICKETMASTER_API_KEY}`
  );
  const data = await response.json();
  return data?._embedded?.events || [];
};
