import { useState, useEffect } from 'react';
import { fetchPopularTours } from '@/integrations/ticketmaster/artists';
import { toSlug } from '@/utils/slug';

interface FeaturedArtistsProps {
  onArtistClick?: (artistName: string) => void;
  shows?: any[];
  isLoading?: boolean;
}

export const FeaturedArtists = ({ onArtistClick, shows = [], isLoading = false }: FeaturedArtistsProps) => {
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);

  useEffect(() => {
    if (shows && shows.length > 0) {
      // Extract unique artists from shows data with enhanced deduplication
      const artistMap = new Map<string, any>();

      shows.forEach((show) => {
        const artist = show._embedded?.attractions?.[0];
        if (!artist?.id || !artist?.name) return;

        // Use both ID and normalized name for stronger deduplication
        const normalizedName = artist.name.toLowerCase().trim();
        const key = `${artist.id}-${normalizedName}`;

        const existingArtist = artistMap.get(key) || {
          id: artist.id,
          name: artist.name,
          image: artist.images?.[0]?.url || show.images?.[0]?.url,
          genre: artist.classifications?.[0]?.segment?.name || 'Music',
          showCount: 0,
        };

        existingArtist.showCount++;
        artistMap.set(key, existingArtist);
      });

      // Filter to only artists with shows in USA and sort by show count
      const artists = Array.from(artistMap.values())
        .filter((artist) => artist.showCount > 0) // Ensure they have shows
        .sort((a, b) => b.showCount - a.showCount)
        .slice(0, 12); // Top 12 unique artists with most shows

      console.log('Featured artists processed:', artists.length, 'unique artists from', shows.length, 'shows');
      setFeaturedArtists(artists);
    }
  }, [shows]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-lg p-4 animate-pulse">
            <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-3" />
            <div className="h-4 bg-zinc-800 rounded mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (featuredArtists.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 text-sm">No featured artists found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {featuredArtists.map((artist, index) => (
        <div
          key={artist.id ?? index}
          className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={() => onArtistClick?.(toSlug(artist.name))}
        >
          <div className="aspect-square mb-3 rounded-lg overflow-hidden">
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {artist.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm truncate mb-1">
            {artist.name}
          </h3>
          <p className="text-zinc-400 text-xs truncate">{artist.genre}</p>
          {artist.showCount > 1 && (
            <p className="text-zinc-500 text-xs mt-1">
              {artist.showCount} shows
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
