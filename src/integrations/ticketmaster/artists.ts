
import { callTicketmasterFunction } from "./api";
import { fetchFromCache } from "./api";
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
    
  const cachedShows = artist ? await fetchFromCache(artist.id) : null;
  if (cachedShows) {
    console.log('Returning cached shows for artist:', artistName);
    return cachedShows;
  }

  const shows = await callTicketmasterFunction('artist', artistName);
  
  if (artist && shows.length > 0) {
    console.log('Updating show cache for artist:', artistName);
    await updateShowCache(shows, artist.id);
  }

  return shows;
};
