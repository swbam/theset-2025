
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Loader2 } from "lucide-react";
import { ShowCard } from "@/components/shows/ShowCard";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function ArtistPage() {
  const { artistName } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch or create artist
  const { data: artist, isLoading: isLoadingArtist } = useQuery({
    queryKey: ['artist', artistName],
    queryFn: async () => {
      if (!artistName) throw new Error('Artist name is required');
      
      // First, try to fetch existing artist
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('name', artistName)
        .maybeSingle();

      if (existingArtist) {
        console.log('Found existing artist:', existingArtist);
        
        // Check if we need to refresh the data
        const { data: needsRefresh } = await supabase
          .rpc('needs_artist_refresh', {
            last_sync: existingArtist.last_synced_at,
            ttl_hours: 1
          });

        if (!needsRefresh) {
          return existingArtist;
        }
        
        console.log('Artist data needs refresh');
      }

      // If artist doesn't exist or needs refresh, create/update it
      console.log('Creating/updating artist:', artistName);
      const { data: artist, error: insertError } = await supabase
        .from('artists')
        .upsert({
          name: artistName,
          // We'll update these fields later when we integrate Spotify
          spotify_id: artistName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error creating/updating artist:', insertError);
        throw insertError;
      }

      return artist;
    },
    retry: false,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['following', artist?.id],
    queryFn: async () => {
      if (!user || !artist) return false;
      const { data } = await supabase
        .from('user_artists')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artist.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!artist,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !artist) throw new Error('Not authenticated or no artist');
      const { error } = await supabase
        .from('user_artists')
        .insert({
          user_id: user.id,
          artist_id: artist.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', artist?.id] });
      queryClient.invalidateQueries({ queryKey: ['followedArtists'] });
      toast({
        title: "Success",
        description: `You are now following ${artist?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow artist. Please try again.",
        variant: "destructive",
      });
      console.error('Follow error:', error);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !artist) throw new Error('Not authenticated or no artist');
      const { error } = await supabase
        .from('user_artists')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', artist?.id] });
      queryClient.invalidateQueries({ queryKey: ['followedArtists'] });
      toast({
        title: "Success",
        description: `You have unfollowed ${artist?.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow artist. Please try again.",
        variant: "destructive",
      });
      console.error('Unfollow error:', error);
    },
  });

  const handleFollowClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow artists",
        variant: "destructive",
      });
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const { data: shows, isLoading: isLoadingShows } = useQuery({
    queryKey: ['artistShows', artistName],
    queryFn: async () => {
      const response = await fetchArtistEvents(artistName || '');
      return response.filter(show => 
        show.name.toLowerCase().includes(artistName?.toLowerCase() || '') &&
        !show.name.toLowerCase().includes('tribute')
      );
    },
    enabled: !!artistName,
  });

  const isLoading = isLoadingArtist || isLoadingShows;

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
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-5xl font-bold text-white">{artistName}</h1>
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={handleFollowClick}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
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
