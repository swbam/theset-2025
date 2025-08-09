import type { Artist } from '@/types/artist';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useArtistFollow } from '@/hooks/useArtistFollow';

interface ArtistHeroProps {
  artist: Artist | null;
  artistName?: string;
  showCount?: number;
}

export const ArtistHero = ({
  artist,
  artistName,
  showCount = 0,
}: ArtistHeroProps) => {
  const { isFollowing, isLoading: isFollowActionPending, toggleFollow } = useArtistFollow(artist?.id || '');
  return (
    <div
      className="h-[500px] relative bg-cover bg-center"
      style={{
        backgroundImage: artist?.image_url
          ? `url(${artist.image_url})`
          : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
      <div className="max-w-7xl mx-auto px-6 relative h-full flex items-end pb-16">
        <div className="flex items-end gap-8">
          {/* Large Artist Image */}
          <div className="relative">
            <img
              src={artist?.image_url || '/placeholder.svg'}
              alt={artistName}
              className="w-48 h-48 rounded-lg object-cover shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          
          {/* Artist Info */}
          <div className="flex-1 pb-4">
            <div className="mb-4">
              <h1 className="text-6xl font-bold text-white mb-3">{artistName}</h1>
              
              {/* Show Count and Follow Button */}
              <div className="flex items-center gap-6 mb-4">
                {showCount > 0 && (
                  <div className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-medium">{showCount} upcoming shows</span>
                  </div>
                )}
                
                <Button
                  variant={isFollowing ? 'secondary' : 'default'}
                  onClick={toggleFollow}
                  disabled={isFollowActionPending}
                  className="px-6 py-2"
                >
                  {isFollowActionPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            </div>
            
            {/* Genres */}
            {artist?.genres && Array.isArray(artist.genres) && (
              <div className="flex gap-2 flex-wrap">
                {artist.genres.slice(0, 4).map((genre: string) => (
                  <span
                    key={genre}
                    className="text-sm px-4 py-2 rounded-full bg-white/15 text-white font-medium backdrop-blur-sm"
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
