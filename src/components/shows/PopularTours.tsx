
import { useQuery } from "@tanstack/react-query";
import { ShowCard } from "./ShowCard";
import { fetchPopularShows } from "@/integrations/ticketmaster/shows";

interface PopularToursProps {
  onArtistClick: (artistName: string) => void;
}

export const PopularTours = ({ onArtistClick }: PopularToursProps) => {
  const { data: shows, isLoading } = useQuery({
    queryKey: ['popularTours'],
    queryFn: () => fetchPopularShows(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Popular Tours</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-black/30 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!shows || shows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Popular Tours</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
};
