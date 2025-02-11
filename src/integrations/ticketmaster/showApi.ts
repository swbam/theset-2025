
import { callTicketmasterFunction } from "./api";
import { updateShowCache } from "./cache";

export const fetchUpcomingStadiumShows = async (artistId?: string) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
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
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
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
    
    const shows = await callTicketmasterFunction('topShows', undefined, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (shows.length > 0) {
      await updateShowCache(shows, artistId);
    }

    return shows;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};
