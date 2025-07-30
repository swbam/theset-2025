import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShowGrid } from '@/components/shows/ShowGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResultsProps {
  query: string;
  artists: any[];
  shows: any[];
  venues: any[];
  isLoading?: boolean;
  onShowClick: (show: any) => void;
  onArtistClick: (artistName: string) => void;
}

export const SearchResults = ({
  query,
  artists,
  shows,
  venues,
  isLoading = false,
  onShowClick,
  onArtistClick
}: SearchResultsProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const totalResults = artists.length + shows.length + venues.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (totalResults === 0 && query) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {query && (
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Search results for "{query}"
          </h2>
          <Badge variant="secondary">
            {totalResults} results
          </Badge>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="shows">
            Shows ({shows.length})
          </TabsTrigger>
          <TabsTrigger value="artists">
            Artists ({artists.length})
          </TabsTrigger>
          <TabsTrigger value="venues">
            Venues ({venues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {/* Top Shows */}
          {shows.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Shows</h3>
                {shows.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('shows')}
                  >
                    View all shows →
                  </Button>
                )}
              </div>
              <ShowGrid 
                shows={shows.slice(0, 3)} 
                onShowClick={onShowClick}
              />
            </section>
          )}

          {/* Top Artists */}
          {artists.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Artists</h3>
                {artists.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('artists')}
                  >
                    View all artists →
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.slice(0, 6).map((artist, index) => (
                  <Card 
                    key={artist.id || index}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onArtistClick(artist.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {artist.images?.[0]?.url ? (
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary-foreground" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-foreground">{artist.name}</h4>
                          {artist.classifications?.[0]?.genre?.name && (
                            <p className="text-sm text-muted-foreground">
                              {artist.classifications[0].genre.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Top Venues */}
          {venues.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Venues</h3>
                {venues.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('venues')}
                  >
                    View all venues →
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venues.slice(0, 3).map((venue, index) => (
                  <Card key={venue.id || index} className="cursor-pointer hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{venue.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {venue.city?.name}{venue.state?.name && `, ${venue.state.name}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="shows">
          <ShowGrid 
            shows={shows} 
            onShowClick={onShowClick}
            emptyMessage="No shows found matching your search"
          />
        </TabsContent>

        <TabsContent value="artists">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {artists.map((artist, index) => (
              <Card 
                key={artist.id || index}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onArtistClick(artist.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {artist.images?.[0]?.url ? (
                      <img
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground">{artist.name}</h4>
                      {artist.classifications?.[0]?.genre?.name && (
                        <p className="text-sm text-muted-foreground">
                          {artist.classifications[0].genre.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="venues">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {venues.map((venue, index) => (
              <Card key={venue.id || index} className="cursor-pointer hover:bg-accent transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {venue.city?.name}{venue.state?.name && `, ${venue.state.name}`}
                      </p>
                      {venue.capacity && (
                        <p className="text-xs text-muted-foreground">
                          Capacity: {venue.capacity.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};