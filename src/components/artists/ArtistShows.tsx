
import { ShowCard } from "@/components/shows/ShowCard";
import type { TicketmasterEvent } from "@/integrations/ticketmaster/types";

interface ArtistShowsProps {
  shows?: TicketmasterEvent[];
}

export const ArtistShows = ({ shows }: ArtistShowsProps) => {
  const validShows = shows?.filter(show => 
    show.dates?.start?.dateTime && 
    new Date(show.dates.start.dateTime) >= new Date()
  ).sort((a, b) => 
    new Date(a.dates.start.dateTime).getTime() - new Date(b.dates.start.dateTime).getTime()
  );

  console.log('Valid shows for artist:', validShows?.length);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-8">
        <h2 className="text-3xl font-semibold text-white">Upcoming Shows</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {validShows && validShows.length > 0 ? (
            validShows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">
              No upcoming shows found for this artist.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
