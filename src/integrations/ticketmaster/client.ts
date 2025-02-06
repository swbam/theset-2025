
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

const fetchFromCache = async (artistId: string | null, ttlHours = 24) => {
  if (!artistId) return [];
  
  const { data: shows, error } = await supabase
    .from('cached_shows')
    .select('*')
    .eq('artist_id', artistId)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_refresh', { 
      last_sync: shows?.[0]?.last_synced_at,
      ttl_hours: ttlHours 
    });

  return needsRefresh ? null : shows;
};

const callTicketmasterFunction = async (endpoint: string, query?: string, params?: Record<string, string>) => {
  console.log(`Calling Ticketmaster API - ${endpoint}:`, { query, params });
  
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
  
  // First try to get the artist ID from our database
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('name', artistName)
    .maybeSingle();
    
  // Try to get from cache first
  const cachedShows = artist ? await fetchFromCache(artist.id) : null;
  if (cachedShows) {
    console.log('Returning cached shows for artist:', artistName);
    return cachedShows;
  }

  // If not in cache or cache expired, fetch from API
  const shows = await callTicketmasterFunction('artist', artistName);
  
  // If we have an artist ID, update the cache
  if (artist && shows.length > 0) {
    console.log('Updating show cache for artist:', artistName);
    const showsToCache = shows.map((show: TicketmasterEvent) => ({
      ticketmaster_id: show.id,
      artist_id: artist.id,
      name: show.name,
      date: show.dates.start.dateTime,
      venue_name: show._embedded?.venues?.[0]?.name,
      venue_location: show._embedded?.venues?.[0],
      ticket_url: show.url,
      last_synced_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from('cached_shows')
      .upsert(showsToCache, { 
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error updating show cache:', upsertError);
    }
  }

  return shows;
};

export const fetchUpcomingStadiumShows = async () => {
  console.log('Fetching upcoming stadium shows');
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    segmentId: 'KZFzniwnSyZfZ7v7nJ'
  });

  // Cache the results if possible
  if (shows.length > 0) {
    const showsToCache = shows.map((show: TicketmasterEvent) => {
      const artist = show._embedded?.attractions?.[0];
      return {
        ticketmaster_id: show.id,
        name: show.name,
        date: show.dates.start.dateTime,
        venue_name: show._embedded?.venues?.[0]?.name,
        venue_location: show._embedded?.venues?.[0],
        ticket_url: show.url,
        last_synced_at: new Date().toISOString()
      };
    });

    const { error: upsertError } = await supabase
      .from('cached_shows')
      .upsert(showsToCache, { 
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error updating show cache:', upsertError);
    }
  }

  return shows;
};

export const fetchLargeVenueShows = async () => {
  console.log('Fetching large venue shows');
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    size: '20',
    sort: 'date,asc',
    keyword: 'stadium,arena'
  });

  // Cache the results if possible
  if (shows.length > 0) {
    const showsToCache = shows.map((show: TicketmasterEvent) => {
      const artist = show._embedded?.attractions?.[0];
      return {
        ticketmaster_id: show.id,
        name: show.name,
        date: show.dates.start.dateTime,
        venue_name: show._embedded?.venues?.[0]?.name,
        venue_location: show._embedded?.venues?.[0],
        ticket_url: show.url,
        last_synced_at: new Date().toISOString()
      };
    });

    const { error: upsertError } = await supabase
      .from('cached_shows')
      .upsert(showsToCache, { 
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error updating show cache:', upsertError);
    }
  }

  return shows;
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'relevance,desc',
    size: '20'
  });

  // Cache the results if possible
  if (shows.length > 0) {
    const showsToCache = shows.map((show: TicketmasterEvent) => {
      const artist = show._embedded?.attractions?.[0];
      return {
        ticketmaster_id: show.id,
        name: show.name,
        date: show.dates.start.dateTime,
        venue_name: show._embedded?.venues?.[0]?.name,
        venue_location: show._embedded?.venues?.[0],
        ticket_url: show.url,
        last_synced_at: new Date().toISOString()
      };
    });

    const { error: upsertError } = await supabase
      .from('cached_shows')
      .upsert(showsToCache, { 
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error updating show cache:', upsertError);
    }
  }

  return shows;
};
