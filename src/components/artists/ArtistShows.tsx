import { ShowCard } from '@/components/shows/ShowCard';
import type { TicketmasterEvent } from '@/integrations/ticketmaster/types';

interface CachedShow {
  id?: string;
  ticketmaster_id?: string;
  name: string;
  date: string;
  venue_name?: string;
  venue_location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  ticket_url?: string;
}

type ShowData = TicketmasterEvent | CachedShow;

interface ArtistShowsProps {
  shows?: ShowData[];
  isLoading?: boolean;
  onShowClick: (show: ShowData) => void;
}

export const ArtistShows = ({ shows, isLoading, onShowClick }: ArtistShowsProps) => {
  console.log('ArtistShows received shows:', shows);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-white">Upcoming Shows</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Helper functions to safely access properties
  const getShowDate = (show: ShowData): string | undefined => {
    if ('date' in show) return show.date;
    if ('dates' in show) return show.dates?.start?.dateTime;
    return undefined;
  };

  const getVenueName = (show: ShowData): string | undefined => {
    if ('venue_name' in show) return show.venue_name;
    if ('_embedded' in show) return show._embedded?.venues?.[0]?.name;
    return undefined;
  };

  const getShowId = (show: ShowData): string | undefined => {
    if ('ticketmaster_id' in show) return show.ticketmaster_id;
    return show.id;
  };

  // Handle both cached_shows format and TicketmasterEvent format
  const validShows = shows
    ?.filter((show) => {
      const showDate = getShowDate(show);
      return showDate; // Just check if there's a date
    })
    .sort((a, b) => {
      const dateA = new Date(getShowDate(a) || '');
      const dateB = new Date(getShowDate(b) || '');
      return dateA.getTime() - dateB.getTime();
    });

  console.log('ArtistShows valid shows after filtering:', validShows);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-white">Upcoming Shows</h2>
        {validShows && validShows.length > 0 && (
          <p className="text-sm text-zinc-400">{validShows.length} shows</p>
        )}
      </div>
      
      {!validShows || validShows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 text-lg">No upcoming shows found for this artist.</p>
          <p className="text-zinc-500 text-sm mt-2">Check back later for tour announcements!</p>
        </div>
      ) : (
        <>
          {/* Table layout for larger screens */}
          <div className="hidden md:block bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-zinc-400">
                <div className="col-span-2">Date</div>
                <div className="col-span-6">Artist & Venue</div>
                <div className="col-span-2"></div>
                <div className="col-span-2 text-right">Action</div>
              </div>
            </div>
            <div className="divide-y divide-zinc-800">
              {validShows.map((show, index) => {
                const showDate = new Date(getShowDate(show) || '');
                const venueName = getVenueName(show);
                const venueLocation = ('venue_location' in show && show.venue_location) ? 
                  `${show.venue_location.city || ''}${show.venue_location.state ? ', ' + show.venue_location.state : ''}` : '';
                
                return (
                  <div 
                    key={getShowId(show) || index}
                    className="px-6 py-4 hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => onShowClick(show)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="text-center">
                          <div className="text-xs text-zinc-400 uppercase font-medium">
                            {showDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {showDate.getDate()}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {showDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {showDate.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-6">
                        <div className="text-white font-medium">{show.name}</div>
                        <div className="text-zinc-400">{venueName}</div>
                        {venueLocation && (
                          <div className="text-sm text-zinc-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {venueLocation}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2 text-right">
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Setlist
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card layout for mobile */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {validShows.map((show, index) => (
              <ShowCard 
                key={getShowId(show) || index} 
                show={show} 
                onClick={() => onShowClick(show)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
