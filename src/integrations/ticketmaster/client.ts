import { supabase } from "@/integrations/supabase/client";

export interface TicketmasterEvent {
  id: string; // Add missing id field
  name: string;
  dates: {
    start: {
      dateTime: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      capacity?: number;
      city?: {
        name: string;
        state?: {
          name: string;
          stateCode?: string;
        };
      };
      state?: {
        name: string;
        stateCode?: string;
      };
      country?: {
        name: string;
        countryCode?: string;
      };
      address?: {
        line1: string;
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

const prepareVenueForCache = (venue: any) => {
  if (!venue?.name) {
    return null;
  }

  return {
    ticketmaster_id: venue.id,
    name: venue.name,
    city: venue.city?.name,
    state: venue.state?.name,
    country: venue.country?.name,
    address: venue.address?.line1,
    location: venue,
    capacity: venue.capacity,
    last_synced_at: new Date().toISOString()
  };
};

const prepareShowForCache = (show: TicketmasterEvent, artistId?: string | null) => {
  if (!show.dates?.start?.dateTime) {
    return null;
  }

  const venue = show._embedded?.venues?.[0];
  
  return {
    ticketmaster_id: show.id,
    artist_id: artistId || null,
    name: show.name,
    date: show.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue,
    ticket_url: show.url,
    last_synced_at: new Date().toISOString()
  };
};

const updateShowCache = async (shows: any[]) => {
  if (shows.length === 0) return;

  // First, extract and upsert all venues
  const venues = shows
    .map(show => show._embedded?.venues?.[0])
    .filter(Boolean)
    .map(prepareVenueForCache)
    .filter(Boolean);

  if (venues.length > 0) {
    const { error: venueError } = await supabase
      .from('venues')
      .upsert(venues, {
        onConflict: 'ticketmaster_id',
        ignoreDuplicates: false
      });

    if (venueError) {
      console.error('Error updating venue cache:', venueError);
      return;
    }
  }

  // Then get the venue IDs for the shows
  const venueIds = new Map<string, string>();
  for (const venue of venues) {
    const { data: venueData } = await supabase
      .from('venues')
      .select('id, ticketmaster_id')
      .eq('ticketmaster_id', venue.ticketmaster_id)
      .single();
    
    if (venueData) {
      venueIds.set(venue.ticketmaster_id, venueData.id);
    }
  }

  // Prepare and upsert shows with venue IDs
  const showsToCache = shows
    .map(show => {
      const prepared = prepareShowForCache(show);
      if (!prepared) return null;

      const venueId = show._embedded?.venues?.[0]?.id;
      if (venueId) {
        prepared.venue_id = venueIds.get(venueId);
      }

      return prepared;
    })
    .filter(Boolean);

  if (showsToCache.length > 0) {
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
  
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('name', artistName)
    .maybeSingle();
    
  const cachedShows = artist ? await fetchFromCache(artist.id) : null;
  if (cachedShows) {
    console.log('Returning cached shows for artist:', artistName);
    return cachedShows;
  }

  const shows = await callTicketmasterFunction('artist', artistName);
  
  if (artist && shows.length > 0) {
    console.log('Updating show cache for artist:', artistName);
    const showsToCache = shows
      .map((show: TicketmasterEvent) => prepareShowForCache(show, artist.id))
      .filter(Boolean);

    await updateShowCache(showsToCache);
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

  if (shows.length > 0) {
    const showsToCache = shows
      .map((show: TicketmasterEvent) => prepareShowForCache(show))
      .filter(Boolean);

    await updateShowCache(showsToCache);
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

  if (shows.length > 0) {
    const showsToCache = shows
      .map((show: TicketmasterEvent) => prepareShowForCache(show))
      .filter(Boolean);

    await updateShowCache(showsToCache);
  }

  return shows;
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'relevance,desc',
    size: '100'
  });

  if (shows.length > 0) {
    const showsToCache = shows
      .map((show: TicketmasterEvent) => prepareShowForCache(show))
      .filter(Boolean);

    await updateShowCache(showsToCache);
  }

  return shows;
};
