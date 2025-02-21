
import { Artist } from "@/integrations/ticketmaster/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ArtistHeroProps {
  artist: Artist | null;
  artistName?: string;
  isFollowing?: boolean;
  isFollowActionPending: boolean;
  onFollowClick: () => void;
}

export const ArtistHero = ({ 
  artist, 
  artistName, 
  isFollowing, 
  isFollowActionPending, 
  onFollowClick 
}: ArtistHeroProps) => {
  const artistGenres = artist?.genres || [];
  
  return (
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
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-5xl font-bold text-white">{artistName}</h1>
              <Button
                variant={isFollowing ? "secondary" : "default"}
                onClick={onFollowClick}
                disabled={isFollowActionPending}
              >
                {isFollowActionPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
            {artistGenres.length > 0 && (
              <div className="flex gap-2">
                {artistGenres.slice(0, 3).map((genre: string) => (
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
  );
};
