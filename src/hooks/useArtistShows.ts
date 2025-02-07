
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";

export const useArtistShows = (normalizedArtistName: string, artistId: string | undefined) => {
  return useQuery({
    queryKey: ['artistShows', normalizedArtistName, artistId],
    queryFn: async () => {
      console.log('Fetching shows for artist:', normalizedArtistName, 'with ID:', artistId);
      const response = await fetchArtistEvents(normalizedArtistName);
      return response.filter(show => 
        show.name.toLowerCase().includes(normalizedArtistName.toLowerCase()) &&
        !show.name.toLowerCase().includes('tribute')
      );
    },
    enabled: !!normalizedArtistName && !!artistId,
  });
};
