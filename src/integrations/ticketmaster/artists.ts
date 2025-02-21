
import { supabase } from "../supabase/client";
import { artistIdentifiers } from "../supabase/artistIdentifiers";
import { searchArtists as searchTicketmasterArtists, fetchArtistEvents as fetchTicketmasterArtistEvents } from "./api";
import { updateShowCache } from "./cache";
import type { TicketmasterEvent } from "./types";

interface ArtistSearchResult {
  name: string;
  image?: string;
  venue?: string;
  date?: string;
  url?: string;
  capacity?: number;
  relevanceScore?: number;
  ticketmaster_id?: string;
}

export const searchArtists = async (query: string): Promise<ArtistSearchResult[]> => {
  console.log('Searching for artists:', query);
  
  try {
    const events = await searchTicketmasterArtists(query);
    
    // Handle empty or invalid response
    if (!events || events.length === 0) {
      console.log('No events found for query:', query);
      return [];
    }
    
    // Filter for music events and remove duplicates
    const uniqueArtists = new Map<string, ArtistSearchResult>();
    
    events.forEach((event: TicketmasterEvent) => {
      const artist = event._embedded?.attractions?.[0];
      if (artist && artist.name) {
        if (!uniqueArtists.has(artist.name)) {
          // Calculate relevance score based on name match and venue capacity
          const nameMatchScore = artist.name.toLowerCase() === query.toLowerCase() ? 1000000 : 
                               artist.name.toLowerCase().includes(query.toLowerCase()) ? 100000 : 0;
          
          // Parse venue capacity, defaulting to 0 if not available
          const venueCapacity = event._embedded?.venues?.[0]?.capacity
            ? parseInt(event._embedded.venues[0].capacity, 10)
            : 0;
          
          uniqueArtists.set(artist.name, {
            name: artist.name,
            image: artist.images?.[0]?.url || event.images?.[0]?.url,
            venue: event._embedded?.venues?.[0]?.name,
            date: event.dates?.start?.dateTime,
            url: event.url,
            capacity: venueCapacity,
            relevanceScore: nameMatchScore + venueCapacity,
            ticketmaster_id: artist.id
          });
        }
      }
    });

    const results = Array.from(uniqueArtists.values())
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Found ${results.length} unique artists`);
    return results;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);
  
  const decodedArtistName = artistName.replace(/-/g, ' ');
  
  // First try to find the artist by name (case-insensitive)
  const { data: existingArtists } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', decodedArtistName);
    
  const existingArtist = existingArtists?.[0];
  
  if (existingArtist) {
    console.log('Found artist in database:', existingArtist);
    const { data: cachedShows } = await supabase
      .from('cached_shows')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('artist_id', existingArtist.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });
      
    if (cachedShows && cachedShows.length > 0) {
      console.log('Returning cached shows for artist:', artistName, cachedShows.length);
      return cachedShows;
    }
  }

  // If we're here, either we didn't find the artist or their shows need refreshing
  console.log('Fetching fresh shows from Ticketmaster for artist:', decodedArtistName);
  
  const shows = await fetchTicketmasterArtistEvents(decodedArtistName);
  
  if (!shows || shows.length === 0) {
    console.log('No shows found for artist:', decodedArtistName);
    return [];
  }

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
        genres: ticketmasterArtist.classifications?.[0]?.genre?.name 
          ? [ticketmasterArtist.classifications[0].genre.name]
          : [],
        popularity: 0, // Will be updated when Spotify data is fetched
      },
      platformData: {
        platform: 'ticketmaster',
        platformId: ticketmasterArtist.id || '',
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
