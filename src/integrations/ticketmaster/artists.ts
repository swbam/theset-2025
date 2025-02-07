
import { supabase } from "@/integrations/supabase/client";
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./shows";
import type { TicketmasterEvent } from "./types";

export const searchArtists = async (query: string) => {
  console.log('Searching for artists:', query);
  const results = await callTicketmasterFunction('events', query, {
    keyword: query,
    classificationName: 'music',
    size: '20'
  });
  
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
    .ilike('name', artistName.replace(/-/g, ' '))
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

  // If we're here, either we didn't find the artist or their shows need refreshing
  const decodedArtistName = artistName.replace(/-/g, ' ');
  console.log('Fetching fresh shows from Ticketmaster for artist:', decodedArtistName);
  
  const shows = await callTicketmasterFunction('events', undefined, {
    keyword: decodedArtistName,
    classificationName: 'music',
    size: '100'
  });
  
  // Filter to ensure we only get shows for this artist
  const filteredShows = shows.filter(show => {
    const attractions = show._embedded?.attractions || [];
    return attractions.some(attraction => 
      attraction.name.toLowerCase() === decodedArtistName.toLowerCase()
    );
  });

  if (artist && filteredShows.length > 0) {
    console.log('Updating show cache for artist:', decodedArtistName);
    await updateShowCache(filteredShows, artist.id);
  }

  return filteredShows;
};
