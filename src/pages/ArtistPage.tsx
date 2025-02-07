
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Loader2 } from "lucide-react";
import { ShowCard } from "@/components/shows/ShowCard";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ArtistPage() {
  const { artistName } = useParams();
  
  const { data: artist } = useQuery({
    queryKey: ['artist', artistName],
    queryFn: async () => {
      const { data } = await supabase
        .from('artists')
        .select('*')
        .eq('name', artistName)
        .maybeSingle();
      return data;
    },
    enabled: !!artistName,
  });

  const { data: shows, isLoading } = useQuery({
    queryKey: ['artistShows', artistName],
    queryFn: async () => {
      const response = await fetchArtistEvents(artistName || '');
      // Filter to only include shows containing the exact artist name
      return response.filter(show => 
        show.name.toLowerCase().includes(artistName?.toLowerCase() || '') &&
        !show.name.toLowerCase().includes('tribute')
      );
    },
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
    <div className="min-h-screen bg-black">
      {/* Hero section with cover image */}
      <div 
        className="h-[400px] relative bg-cover bg-center"
        style={{ 
          backgroundImage: artist?.cover_image_url 
            ? `url(${artist.cover_image_url})` 
            : 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black" />
        <div className="max-w-7xl mx-auto px-6 relative h-full flex items-end pb-12">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-background">
              {artist?.image_url ? (
                <AvatarImage src={artist.image_url} alt={artistName} />
              ) : (
                <AvatarFallback>{artistName?.[0]}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-5xl font-bold text-white mb-4">{artistName}</h1>
              {artist?.genres && Array.isArray(artist.genres) && (
                <div className="flex gap-2">
                  {artist.genres.slice(0, 3).map((genre: string) => (
                    <span 
                      key={genre} 
                      className="text-xs px-3 py-1 rounded-full bg-white/10 text-white font-medium"
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
          <h2 className="text-3xl font-semibold text-white">Upcoming Shows</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {validShows?.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
            {(!validShows || validShows.length === 0) && (
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
