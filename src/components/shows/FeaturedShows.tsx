
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ShowCard } from "./ShowCard";
import { fetchFeaturedShows, type TicketmasterEvent } from "@/integrations/ticketmaster/client";

interface FeaturedShowsProps {
  onArtistClick: (artistName: string) => void;
}

export const FeaturedShows = ({ onArtistClick }: FeaturedShowsProps) => {
  const { data: featuredShows = [], isLoading } = useQuery({
    queryKey: ['featuredShows'],
    queryFn: fetchFeaturedShows,
  });

  const groupShowsByMonth = (shows: TicketmasterEvent[] = []) => {
    const grouped = shows.reduce((acc, show) => {
      const monthYear = format(new Date(show.dates.start.dateTime), 'MMMM yyyy');
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(show);
      return acc;
    }, {} as Record<string, TicketmasterEvent[]>);

    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        const capacityA = a._embedded?.venues?.[0]?.capacity || 0;
        const capacityB = b._embedded?.venues?.[0]?.capacity || 0;
        return capacityB - capacityA;
      });
    });

    return Object.entries(grouped).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
  };

  if (isLoading) {
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

  return (
    <div className="space-y-12">
      {groupShowsByMonth(featuredShows).map(([month, shows]) => (
        <div key={month} className="space-y-6">
          <h3 className="text-xl font-medium text-muted-foreground">{month}</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shows.map((show) => (
              <ShowCard 
                key={`${show.name}-${show.dates.start.dateTime}-${show._embedded?.venues?.[0]?.name}`} 
                show={show} 
                onArtistClick={onArtistClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
