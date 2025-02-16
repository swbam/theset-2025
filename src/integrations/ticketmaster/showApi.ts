
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./cache";

export const fetchPopularShows = async (artistId?: string) => {
  try {
    const response = await callTicketmasterFunction('events', undefined, {
      size: '200', // Request more to ensure we get enough unique artists
      sort: 'popularity,desc',
      segmentId: 'KZFzniwnSyZfZ7v7nJ', // Music segment
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no'
    });

    const shows = response?._embedded?.events || [];
    
    // Filter for unique artists
    const uniqueArtistShows = shows.reduce((acc: any[], show: any) => {
      const artist = show._embedded?.attractions?.[0];
      const venue = show._embedded?.venues?.[0];
      
      // Skip if no artist or venue
      if (!artist?.name || !venue?.name) return acc;
      
      // Check if we already have this artist
      const artistExists = acc.some(s => 
        s._embedded?.attractions?.[0]?.name === artist.name
      );
      
      // Only add if it's a new artist and we haven't reached our limit
      if (!artistExists && acc.length < 20) {
        acc.push(show);
      }
      
      return acc;
    }, []);

    if (uniqueArtistShows && uniqueArtistShows.length > 0) {
      await updateShowCache(uniqueArtistShows, artistId);
    }

    return uniqueArtistShows;
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    return [];
  }
};
