
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

export const searchArtists = async (query: string) => {
  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .maybeSingle();

  if (secretError || !secretData?.value) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(query)}&classificationName=music&size=20&sort=date,asc&apikey=${secretData.value}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch from Ticketmaster');
  }
  
  const result = await response.json();
  return result?._embedded?.events || [];
};

export const fetchArtistEvents = async (artistName: string) => {
  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .maybeSingle();

  if (secretError || !secretData?.value) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(artistName)}&classificationName=music&size=50&sort=date,asc&apikey=${secretData.value}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch from Ticketmaster');
  }
  
  const result = await response.json();
  return result?._embedded?.events || [];
};

export const fetchFeaturedShows = async () => {
  const { data: secretData, error: secretError } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .maybeSingle();

  if (secretError || !secretData?.value) {
    throw new Error('Ticketmaster API key not found');
  }

  const response = await fetch(
    `${BASE_URL}/events.json?classificationName=music&size=20&sort=relevance,desc&includeTBA=no&includeTBD=no&apikey=${secretData.value}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch from Ticketmaster');
  }

  const result = await response.json();
  return result?._embedded?.events || [];
};
