
import { useQuery } from "@tanstack/react-query";
import { ShowCard } from "./ShowCard";
import { fetchPopularShows } from "@/integrations/ticketmaster/client";
import type { CachedShow } from "@/types/show";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/types";

const convertTicketmasterToCachedShow = (event: TicketmasterEvent): CachedShow => {
  const venue = event._embedded?.venues?.[0];
  const artist = event._embedded?.attractions?.[0];

  return {
    id: event.id,
    platform_id: event.id,
    artist_id: artist?.id || '',
    name: event.name,
    date: event.dates.start.dateTime,
    venue_name: venue?.name,
    venue_location: venue?.displayLocation || `${venue?.city?.name || ''}, ${venue?.state?.name || ''}`.trim(),
    ticket_url: event.url,
    status: event.dates?.status?.code
  };
};

export const PopularTours = () => {
  const { data: shows, isLoading } = useQuery({
    queryKey: ['popularShows'],
    queryFn: async () => {
      const events = await fetchPopularShows();
      return events.map(convertTicketmasterToCachedShow);
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shows?.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
};
