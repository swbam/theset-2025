
import { ShowCard } from "@/components/shows/ShowCard";
import type { TicketmasterEvent, CachedShow } from "@/integrations/ticketmaster/types";

interface ArtistShowsProps {
  shows?: (TicketmasterEvent | CachedShow)[];
}

export const ArtistShows = ({ shows }: ArtistShowsProps) => {
  const validShows = shows?.filter(show => {
    // Handle both TicketmasterEvent and CachedShow types
    const showDate = 'dates' in show ? 
      new Date(show.dates.start.dateTime) : 
      new Date(show.date);
    
    // Make sure the show is in the future and has a valid date
    return showDate && showDate >= new Date();
  }).sort((a, b) => {
    const dateA = 'dates' in a ? 
      new Date(a.dates.start.dateTime) : 
      new Date(a.date);
    const dateB = 'dates' in b ? 
      new Date(b.dates.start.dateTime) : 
      new Date(b.date);
    
    return dateA.getTime() - dateB.getTime();
  });

  console.log('Valid shows for artist:', validShows?.length, validShows);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-8">
        <h2 className="text-3xl font-semibold text-white">Upcoming Shows</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {validShows && validShows.length > 0 ? (
            validShows.map((show) => (
              <ShowCard 
                key={'ticketmaster_id' in show ? show.ticketmaster_id : show.id} 
                show={show} 
              />
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
