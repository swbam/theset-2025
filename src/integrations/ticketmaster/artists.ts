import { supabase } from "../supabase/client";
import { artistIdentifiers } from "../supabase/artistIdentifiers";
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./cache";
import type { TicketmasterEvent } from "./types";

export const searchArtists = async (query: string) => {
  console.log('Searching for artists:', query);
  const response = await callTicketmasterFunction('events', query, {
    keyword: query,
    classificationName: 'music',
    size: '50',
    sort: 'relevance,desc'
  });
  
  // Handle empty or invalid response
  if (!response?._embedded?.events) {
    console.log('No events found for query:', query);
    return [];
  }
  
  const events = response._embedded.events;
  
  // Filter for music events and remove duplicates
  const uniqueArtists = new Map();
  
  events.forEach((event: TicketmasterEvent) => {
    const artist = event._embedded?.attractions?.[0];
    if (artist && artist.name) {
      if (!uniqueArtists.has(artist.name)) {
        // Calculate relevance score based on name match and venue capacity
        const nameMatchScore = artist.name.toLowerCase() === query.toLowerCase() ? 1000000 : 
                             artist.name.toLowerCase().includes(query.toLowerCase()) ? 100000 : 0;
        const capacity = event._embedded?.venues?.[0]?.capacity || 0;
        
        uniqueArtists.set(artist.name, {
          name: artist.name,
          image: artist.images?.[0]?.url || event.images?.[0]?.url,
          venue: event._embedded?.venues?.[0]?.name,
          date: event.dates.start.dateTime,
          url: event.url,
          capacity: capacity,
          relevanceScore: nameMatchScore + capacity,
          ticketmaster_id: artist.id
        });
      }
    }
  });

  return Array.from(uniqueArtists.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);
  
  const decodedArtistName = artistName.replace(/-/g, ' ');
  
  // First try to find the artist by name (case-insensitive)
  const { data: existingArtists } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', decodedArtistName);
    
  let artist = existingArtists?.[0];
  
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
      console.log('Returning cached shows for artist:', artistName, cachedShows.length);
      return cachedShows;
    }
  }

  // If we're here, either we didn't find the artist or their shows need refreshing
  console.log('Fetching fresh shows from Ticketmaster for artist:', decodedArtistName);
  
  const response = await callTicketmasterFunction('events', undefined, {
    keyword: decodedArtistName,
    classificationName: 'music',
    size: '100'
  });
  
  if (!response?._embedded?.events) {
    console.log('No shows found for artist:', decodedArtistName);
    return [];
  }

  const shows = response._embedded.events;
  
  // Filter to ensure we only get shows for this artist
  const filteredShows = shows.filter(show => {
    const attractions = show._embedded?.attractions || [];
    return attractions.some(attraction => 
      attraction.name.toLowerCase() === decodedArtistName.toLowerCase()
    );
  });

  if (filteredShows.length > 0) {
    console.log('Found shows for artist:', decodedArtistName, filteredShows.length);
    
    // Get the Ticketmaster artist ID from the first show
    const ticketmasterArtist = filteredShows[0]._embedded?.attractions?.find(
      attraction => attraction.name.toLowerCase() === decodedArtistName.toLowerCase()
    );
    
    if (!ticketmasterArtist) {
      console.error('Could not find matching artist in show data');
      return filteredShows;
    }

    // Use the artistIdentifiers utility to create or update the artist
    const upsertedArtist = await artistIdentifiers.upsertArtist({
      name: decodedArtistName,
      metadata: {
        genres: ticketmasterArtist.classifications?.[0]?.genre?.name,
        popularity: 0, // Will be updated when Spotify data is fetched
      },
      platformData: {
        platform: 'ticketmaster',
        platformId: ticketmasterArtist.id,
        data: ticketmasterArtist
      }
    });

    if (upsertedArtist) {
      console.log('Updating show cache for artist:', decodedArtistName);
      await updateShowCache(filteredShows, upsertedArtist.id);
      
      // Fetch the cached shows after updating
      const { data: newCachedShows } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('artist_id', upsertedArtist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });
        
      if (newCachedShows && newCachedShows.length > 0) {
        console.log('Returning newly cached shows:', newCachedShows.length);
        return newCachedShows;
      }
    }
  }

  return filteredShows;
};
