
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
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(query)}&classificationName=music&size=20&sort=date,asc&apikey=${data.value}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch from Ticketmaster');
  }
  
  const result = await response.json();
  const events = result?._embedded?.events || [];

  // Store events in our shows table
  const showsToInsert = events.map((event: TicketmasterEvent) => ({
    artist_name: event.name,
    venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
    event_date: event.dates.start.dateTime,
    ticket_url: event.url,
    image_url: event.images?.[0]?.url
  }));

  if (showsToInsert.length > 0) {
    await supabase.from('shows').insert(showsToInsert);
  }

  return events;
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

  // Fetch major stadium/arena shows
  const response = await fetch(
    `${BASE_URL}/events.json?classificationName=music&size=20&sort=relevance,desc&includeTBA=no&includeTBD=no&apikey=${data.value}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch from Ticketmaster');
  }

  const result = await response.json();
  const events = result?._embedded?.events || [];

  // Store events in our shows table
  const showsToInsert = events.map((event: TicketmasterEvent) => ({
    artist_name: event.name,
    venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
    event_date: event.dates.start.dateTime,
    ticket_url: event.url,
    image_url: event.images?.[0]?.url
  }));

  if (showsToInsert.length > 0) {
    await supabase.from('shows').insert(showsToInsert);
  }

  return events;
};
