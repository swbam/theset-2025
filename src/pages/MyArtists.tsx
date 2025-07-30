import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';

interface FollowedArtist {
  id: string;
  artist_id: string;
  artists: {
    id: string;
    name: string;
    image_url?: string;
    genres?: any;
    metadata?: any;
  };
}

export default function MyArtists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollowedArtists();
    }
  }, [user]);

  const fetchFollowedArtists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_artists')
        .select(`
          id,
          artist_id,
          artists:artist_id (
            id,
            name,
            image_url,
            genres,
            metadata
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setFollowedArtists(data || []);
    } catch (error: any) {
      console.error('Error fetching followed artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your followed artists',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (artistId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_artists')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artistId);

      if (error) throw error;

      setFollowedArtists(prev => prev.filter(fa => fa.artist_id !== artistId));
      
      toast({
        title: 'Unfollowed',
        description: 'Artist removed from your following list',
      });
    } catch (error: any) {
      console.error('Error unfollowing artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to unfollow artist',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <TopNavigation />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <div className="max-w-6xl mx-auto p-4 md:p-8 py-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-white">
              <Users className="h-8 w-8" />
              My Artists
            </h1>
            <p className="text-zinc-400">
              Artists you're following and their upcoming shows
            </p>
          </div>

          {followedArtists.length === 0 ? (
            <Card className="text-center py-12 bg-zinc-900 border-zinc-800">
              <CardContent>
                <Music className="h-16 w-16 mx-auto text-zinc-500 mb-4" />
                <CardTitle className="mb-2 text-white">No artists followed yet</CardTitle>
                <CardDescription className="mb-4 text-zinc-400">
                  Start following your favorite artists to see their upcoming shows
                </CardDescription>
                <Button onClick={() => navigate('/search')}>
                  Discover Artists
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedArtists.map((followedArtist) => {
                const artist = followedArtist.artists;
                return (
                  <Card key={followedArtist.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={artist.image_url} />
                          <AvatarFallback className="bg-zinc-800 text-white">
                            {artist.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white">{artist.name}</CardTitle>
                          {artist.genres && Array.isArray(artist.genres) && artist.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {artist.genres.slice(0, 2).map((genre: string) => (
                                <Badge key={genre} variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          View Shows
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUnfollow(artist.id)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          Unfollow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}