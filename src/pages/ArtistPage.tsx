
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Loader2 } from "lucide-react";
import { ShowCard } from "@/components/shows/ShowCard";
import { supabase } from "@/integrations/supabase/client";

export default function ArtistPage() {
  const { artistName } = useParams();
  
  const { data: artist } = useQuery({
    queryKey: ['artist', artistName],
    queryFn: async () => {
      const { data } = await supabase
        .from('artists')
        .select('*')
        .eq('name', artistName)
        .single();
      return data;
    },
    enabled: !!artistName,
  });

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
    <div>
      {/* Hero section with cover image */}
      <div 
        className="h-[300px] relative bg-cover bg-center"
        style={{ 
          backgroundImage: artist?.cover_image_url 
            ? `url(${artist.cover_image_url})` 
            : 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-7xl mx-auto px-6 relative h-full flex items-end pb-6">
          <div className="flex items-end gap-6">
            {artist?.image_url && (
              <img 
                src={artist.image_url} 
                alt={artistName}
                className="w-48 h-48 rounded-lg border-4 border-background shadow-xl"
              />
            )}
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white mb-2">{artistName}</h1>
              {artist?.genres && Array.isArray(artist.genres) && (
                <div className="flex gap-2">
                  {artist.genres.slice(0, 3).map((genre: string) => (
                    <span 
                      key={genre} 
                      className="text-xs px-2 py-1 rounded-full bg-white/10 text-white"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-7xl mx-auto p-6">
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
    </div>
  );
}
