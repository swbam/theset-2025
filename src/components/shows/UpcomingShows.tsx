import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import {
  fetchPopularTours,
  type TicketmasterEvent,
} from '@/integrations/ticketmaster/client';

interface UpcomingShowsProps {
  onArtistClick: (artistName: string) => void;
}

interface ShowCard {
  id: string;
  artistName: string;
  image?: string;
  date: string;
  venue: string;
  location: string;
}

export const UpcomingShows = ({ onArtistClick }: UpcomingShowsProps) => {
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['upcomingShows'],
    queryFn: fetchPopularTours,
  });

  const processShows = (shows: TicketmasterEvent[]): ShowCard[] => {
    return shows
      .slice(0, 3) // Show 3 upcoming shows like in the screenshot
      .map((show) => {
        const artist = show._embedded?.attractions?.[0];
        const venue = show._embedded?.venues?.[0];

        return {
          id: show.id,
          artistName: artist?.name || 'Unknown Artist',
          image: artist?.images?.[0]?.url || show.images?.[0]?.url,
          date: show.dates.start.dateTime,
          venue: venue?.name || '',
          location:
            venue?.city?.name && venue?.state?.name
              ? `${venue.city.name}, ${venue.state.name}`
              : venue?.city?.name || venue?.state?.name || '',
        };
      });
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
              <div className="aspect-square bg-zinc-700 rounded-t-lg" />
              <div className="p-6">
                <div className="h-5 w-32 mb-3 bg-zinc-700 rounded" />
                <div className="h-4 w-28 mb-2 bg-zinc-700 rounded" />
                <div className="h-4 w-36 bg-zinc-700 rounded" />
              </div>
            </Card>
          ))}
      </div>
    );
  }

  const upcomingShows = processShows(shows);

  if (upcomingShows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">No upcoming shows found</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {upcomingShows.map((show) => (
        <Card
          key={show.id}
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer overflow-hidden"
          onClick={() => onArtistClick(show.artistName)}
        >
          <div
            className="aspect-square bg-cover bg-center"
            style={{
              backgroundImage: show.image ? `url(${show.image})` : undefined,
              backgroundColor: !show.image
                ? 'rgba(255,255,255,0.1)'
                : undefined,
            }}
          />
          <div className="p-6">
            <h3
              className="text-white font-semibold text-lg mb-3 truncate"
              title={show.artistName}
            >
              {show.artistName}
            </h3>
            <div className="flex items-center text-sm text-zinc-400 mb-2">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {new Date(show.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center text-sm text-zinc-400">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span
                className="truncate"
                title={`${show.venue}, ${show.location}`}
              >
                {show.venue && show.location
                  ? `${show.venue}, ${show.location}`
                  : show.venue || show.location}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
