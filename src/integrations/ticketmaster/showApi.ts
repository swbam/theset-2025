import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./cache";
import { TicketmasterEvent } from "./types";

export const fetchPopularShows = async (artistId?: string) => {
  try {
    // Format current date in Ticketmaster's required format (YYYY-MM-DDTHH:mm:ssZ)
    const now = new Date();
    const startDateTime = now.toISOString().split('.')[0] + 'Z';
    
    console.log('Fetching popular shows from:', startDateTime);

    const response = await callTicketmasterFunction('events', undefined, {
      size: '200', // Request more to ensure we get enough unique artists
      sort: 'relevance,desc',
      classificationName: 'music',
      countryCode: 'US',
      startDateTime: startDateTime,
      includeTest: 'no',
      includeTBA: 'no',
      includeTBD: 'no'
    });

    const shows = response?._embedded?.events || [];
    
    // Filter and sort shows
    const uniqueArtistShows = shows.reduce((acc: TicketmasterEvent[], show: TicketmasterEvent) => {
      const artist = show._embedded?.attractions?.[0];
      const venue = show._embedded?.venues?.[0];
      
      // Skip if no artist or venue
      if (!artist?.name || !venue?.name) return acc;
      
      // Skip if the show name indicates it's a multi-day pass without a specific date
      if (show.name.toLowerCase().includes('pass') && !show.dates?.start?.dateTime) {
        return acc;
      }

      // For multi-day events, ensure they have a valid start date
      if ((show.name.toLowerCase().includes('day pass') || 
           show.name.toLowerCase().includes('weekend')) && 
          !show.dates?.start?.dateTime) {
        return acc;
      }
      
      // Check if we already have this artist
      const artistExists = acc.some(s => 
        s._embedded?.attractions?.[0]?.name === artist.name
      );
      
      // Only add if it's a new artist and we haven't reached our limit
      if (!artistExists && acc.length < 20) {
        // Validate the date before adding
        try {
          const date = new Date(show.dates.start.dateTime);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date for show:', show.name, show.dates.start.dateTime);
            return acc;
          }
          acc.push(show);
        } catch (error) {
          console.warn('Error parsing date for show:', show.name, error);
          return acc;
        }
      }
      
      return acc;
    }, []);

    // Sort shows by date
    uniqueArtistShows.sort((a, b) => {
      const dateA = new Date(a.dates.start.dateTime);
      const dateB = new Date(b.dates.start.dateTime);
      return dateA.getTime() - dateB.getTime();
    });

    if (uniqueArtistShows && uniqueArtistShows.length > 0) {
      await updateShowCache(uniqueArtistShows, artistId);
    }

    return uniqueArtistShows;
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    return [];
  }
};
