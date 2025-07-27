import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchPopularTours, type TicketmasterEvent } from "@/integrations/ticketmaster/client";

interface FeaturedArtistsProps {
  onArtistClick: (artistName: string) => void;
}

interface FeaturedArtist {
  name: string;
  image?: string;
  genre: string;
  showCount: number;
}

export const FeaturedArtists = ({ onArtistClick }: FeaturedArtistsProps) => {
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['featuredArtists'],
    queryFn: fetchPopularTours,
  });

  const processArtists = (shows: TicketmasterEvent[]): FeaturedArtist[] => {
    const artistMap = new Map<string, FeaturedArtist>();

    shows.forEach(show => {
      const artist = show._embedded?.attractions?.[0];
      if (!artist?.name) return;

      const existingArtist = artistMap.get(artist.name) || {
        name: artist.name,
        image: artist.images?.[0]?.url || show.images?.[0]?.url,
        genre: artist.classifications?.[0]?.genre?.name || 'Music',
        showCount: 0,
      };

      existingArtist.showCount++;
      artistMap.set(artist.name, existingArtist);
    });

    return Array.from(artistMap.values())
      .sort((a, b) => b.showCount - a.showCount)
      .slice(0, 5); // Show 5 featured artists like in the screenshot
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <div className="p-6 text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-zinc-700 rounded-full" />
              <div className="h-4 w-24 mx-auto mb-2 bg-zinc-700 rounded" />
              <div className="h-3 w-16 mx-auto mb-2 bg-zinc-700 rounded" />
              <div className="h-3 w-20 mx-auto bg-zinc-700 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const artists = processArtists(shows);

  if (artists.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500">No featured artists found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {artists.map((artist) => (
        <Card 
          key={artist.name}
          className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => onArtistClick(artist.name)}
        >
          <div className="p-6 text-center">
            <div 
              className="w-32 h-32 mx-auto mb-4 rounded-full bg-cover bg-center border-2 border-zinc-700"
              style={{
                backgroundImage: artist.image ? `url(${artist.image})` : undefined,
                backgroundColor: !artist.image ? 'rgba(255,255,255,0.1)' : undefined,
              }}
            />
            <h3 className="text-white font-semibold text-base mb-2 truncate" title={artist.name}>
              {artist.name}
            </h3>
            <p className="text-zinc-400 text-sm mb-2">{artist.genre}</p>
            <p className="text-zinc-500 text-xs">
              {artist.showCount} upcoming {artist.showCount === 1 ? 'show' : 'shows'}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
