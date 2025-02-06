
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
  const { data, error } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .maybeSingle();

  if (error || !data?.value) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(query)}&apikey=${data.value}`
  );
  const result = await response.json();
  return result?._embedded?.events || [];
};

export const fetchFeaturedShows = async () => {
  const { data, error } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .maybeSingle();

  if (error || !data?.value) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?classificationName=music&sort=date,asc&size=3&apikey=${data.value}`
  );
  const result = await response.json();
  return result?._embedded?.events || [];
};
