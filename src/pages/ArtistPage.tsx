
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Loader2 } from "lucide-react";
import { ShowCard } from "@/components/shows/ShowCard";

export default function ArtistPage() {
  const { artistName } = useParams();
  
  const { data: shows, isLoading } = useQuery({
    queryKey: ['artistShows', artistName],
    queryFn: () => fetchArtistEvents(artistName || ''),
    enabled: !!artistName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const validShows = shows?.filter(show => show.dates?.start?.dateTime)
    .sort((a, b) => new Date(a.dates.start.dateTime).getTime() - new Date(b.dates.start.dateTime).getTime());

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">{artistName}</h1>
      
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold">Upcoming Shows</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {validShows?.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
          {validShows?.length === 0 && (
            <p className="text-muted-foreground col-span-full">
              No upcoming shows found for this artist.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
