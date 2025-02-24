
import { supabase } from "@/integrations/supabase/client";
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./shows";
import type { TicketmasterEvent } from "./types";

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
    
  if (artist) {
    console.log('Found artist in database:', artist);
    const { data: cachedShows } = await supabase
      .from('cached_shows')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('artist_id', artist.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });
      
    if (cachedShows && cachedShows.length > 0) {
      console.log('Returning cached shows for artist:', artistName);
      return cachedShows;
    }
  }

  console.log('Fetching fresh shows from Ticketmaster for artist:', artistName);
  const shows = await callTicketmasterFunction('artist', artistName);
  
  if (artist && shows.length > 0) {
    console.log('Updating show cache for artist:', artistName);
    await updateShowCache(shows, artist.id);
  }

  return shows;
};

export const fetchPopularTours = async () => {
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'relevance,desc',
    size: '100'
  });

  if (shows.length > 0) {
    await updateShowCache(shows);
  }

  return shows;
};
