
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ShowCard } from "./ShowCard";
import { 
  fetchUpcomingStadiumShows, 
  fetchLargeVenueShows, 
  fetchPopularTours,
  type TicketmasterEvent 
} from "@/integrations/ticketmaster/client";

interface FeaturedShowsProps {
  onArtistClick: (artistName: string) => void;
}

export const FeaturedShows = ({ onArtistClick }: FeaturedShowsProps) => {
  const { data: upcomingShows = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcomingStadiumShows'],
    queryFn: fetchUpcomingStadiumShows,
  });

  const { data: largeVenueShows = [], isLoading: loadingVenues } = useQuery({
    queryKey: ['largeVenueShows'],
    queryFn: fetchLargeVenueShows,
  });

  const { data: popularTours = [], isLoading: loadingPopular } = useQuery({
    queryKey: ['popularTours'],
    queryFn: fetchPopularTours,
  });

  const isLoading = loadingUpcoming || loadingVenues || loadingPopular;

  const ShowsSection = ({ title, shows, loading }: { 
    title: string; 
    shows: TicketmasterEvent[];
    loading: boolean;
  }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 flex flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-accent rounded" />
                  <div className="h-3 w-32 bg-accent rounded" />
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="h-3 w-40 bg-accent rounded" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (!shows.length) {
      return null;
    }

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shows.slice(0, 6).map((show) => (
            <ShowCard 
              key={`${show.name}-${show.dates.start.dateTime}-${show._embedded?.venues?.[0]?.name}`} 
              show={show} 
              onArtistClick={onArtistClick}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-16">
        <ShowsSection title="Upcoming Stadium Tours" shows={[]} loading={true} />
        <ShowsSection title="Major Arena Shows" shows={[]} loading={true} />
        <ShowsSection title="Popular Artist Tours" shows={[]} loading={true} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <ShowsSection 
        title="Upcoming Stadium Tours" 
        shows={upcomingShows}
        loading={loadingUpcoming}
      />
      <ShowsSection 
        title="Major Arena Shows" 
        shows={largeVenueShows}
        loading={loadingVenues}
      />
      <ShowsSection 
        title="Popular Artist Tours" 
        shows={popularTours}
        loading={loadingPopular}
      />
    </div>
  );
};
