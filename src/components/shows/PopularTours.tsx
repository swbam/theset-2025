
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { fetchPopularTours, type TicketmasterEvent } from "@/integrations/ticketmaster/client";

interface PopularToursProps {
  onArtistClick: (artistName: string) => void;
}

interface ArtistInfo {
  name: string;
  image?: string;
  showCount: number;
  nextShow?: {
    date: string;
    venue: string;
    location: string;
  };
}

export const PopularTours = ({ onArtistClick }: PopularToursProps) => {
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['popularTours'],
    queryFn: fetchPopularTours,
  });

  const processShows = (shows: TicketmasterEvent[]): ArtistInfo[] => {
    const artistMap = new Map<string, ArtistInfo>();

    shows.forEach(show => {
      const artist = show._embedded?.attractions?.[0];
      if (!artist?.name) return;

      const existingArtist = artistMap.get(artist.name) || {
        name: artist.name,
        image: artist.images?.[0]?.url || show.images?.[0]?.url,
        showCount: 0,
      };

      existingArtist.showCount++;

      // Update next show if this is the first one or if it's earlier than the current next show
      const showDate = new Date(show.dates.start.dateTime);
      const currentNextShow = existingArtist.nextShow ? new Date(existingArtist.nextShow.date) : null;
      
      if (!currentNextShow || showDate < currentNextShow) {
        const venue = show._embedded?.venues?.[0];
        existingArtist.nextShow = {
          date: show.dates.start.dateTime,
          venue: venue?.name || '',
          location: venue?.city?.name && venue?.state?.name ? 
            `${venue.city.name}, ${venue.state.name}` : 
            venue?.city?.name || venue?.state?.name || '',
        };
      }

      artistMap.set(artist.name, existingArtist);
    });

    return Array.from(artistMap.values())
      .sort((a, b) => b.showCount - a.showCount)
      .slice(0, 6);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Popular Artist Tours</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
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
      </div>
    );
  }

  const artists = processShows(shows);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Popular Artist Tours</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Card 
            key={artist.name}
            className="hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onArtistClick(artist.name)}
          >
            <div className="p-6 flex flex-row items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0"
                style={{
                  backgroundImage: artist.image ? `url(${artist.image})` : undefined,
                  backgroundColor: !artist.image ? 'rgba(255,255,255,0.1)' : undefined,
                }}
              />
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">{artist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {artist.showCount} upcoming {artist.showCount === 1 ? 'show' : 'shows'}
                </p>
              </div>
            </div>
            {artist.nextShow && (
              <div className="px-6 pb-6 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(artist.nextShow.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {artist.nextShow.venue}
                  {artist.nextShow.location && `, ${artist.nextShow.location}`}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
