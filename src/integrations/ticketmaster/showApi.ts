
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./cache";

export const fetchUpcomingStadiumShows = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const response = await callTicketmasterFunction('events', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      size: '200',
      segmentId: 'KZFzniwnSyZfZ7v7nJ', // Music segment
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no',
      sort: 'date,asc'
    });

    const shows = response?._embedded?.events || [];
    
    // Filter for stadium/arena shows and get unique artists
    const uniqueArtistShows = shows.reduce((acc: any[], show: any) => {
      const artist = show._embedded?.attractions?.[0];
      const venue = show._embedded?.venues?.[0];
      
      // Skip if no artist or venue
      if (!artist?.name || !venue?.name) return acc;
      
      // Check if we already have this artist
      const artistExists = acc.some(s => 
        s._embedded?.attractions?.[0]?.name === artist.name
      );
      
      // Only add if it's a new artist
      if (!artistExists) {
        acc.push(show);
      }
      
      return acc;
    }, []);

    if (uniqueArtistShows && uniqueArtistShows.length > 0) {
      await updateShowCache(uniqueArtistShows, artistId);
    }

    return uniqueArtistShows;
  } catch (error) {
    console.error('Error fetching stadium shows:', error);
    return [];
  }
};

export const fetchLargeVenueShows = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const response = await callTicketmasterFunction('events', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      size: '200',
      segmentId: 'KZFzniwnSyZfZ7v7nJ', // Music segment
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no',
      sort: 'date,asc'
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
      
      // Only add if it's a new artist
      if (!artistExists) {
        acc.push(show);
      }
      
      return acc;
    }, []);

    if (uniqueArtistShows && uniqueArtistShows.length > 0) {
      await updateShowCache(uniqueArtistShows, artistId);
    }

    return uniqueArtistShows;
  } catch (error) {
    console.error('Error fetching venue shows:', error);
    return [];
  }
};

export const fetchPopularTours = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const response = await callTicketmasterFunction('events', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      size: '200',
      segmentId: 'KZFzniwnSyZfZ7v7nJ', // Music segment
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no',
      sort: 'relevance,desc'
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
      
      // Only add if it's a new artist
      if (!artistExists) {
        acc.push(show);
      }
      
      return acc;
    }, []);

    if (uniqueArtistShows && uniqueArtistShows.length > 0) {
      await updateShowCache(uniqueArtistShows, artistId);
    }

    return uniqueArtistShows;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};
