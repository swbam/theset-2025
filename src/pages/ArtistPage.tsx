
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchArtistEvents } from "@/integrations/ticketmaster/client";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArtistHero } from "@/components/artists/ArtistHero";
import { ArtistShows } from "@/components/artists/ArtistShows";
import { transformDatabaseArtist, type DatabaseArtist } from "@/types/artist";

export default function ArtistPage() {
  const { artistName } = useParams();
  const decodedArtistName = artistName ? decodeURIComponent(artistName).replace(/-/g, ' ') : '';
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch or create artist
  const { data: artist, isLoading: isLoadingArtist } = useQuery({
    queryKey: ['artist', decodedArtistName],
    queryFn: async () => {
      if (!decodedArtistName) throw new Error('Artist name is required');
      
      // First, try to fetch existing artist
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('name', decodedArtistName)
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
          return transformDatabaseArtist(existingArtist as DatabaseArtist);
        }
        
        console.log('Artist data needs refresh');
      }

      // If artist doesn't exist or needs refresh, create/update it
      console.log('Creating/updating artist:', decodedArtistName);
      const { data: artist, error: insertError } = await supabase
        .from('artists')
        .upsert({
          name: decodedArtistName,
          // We'll update these fields later when we integrate Spotify
          spotify_id: decodedArtistName.toLowerCase().replace(/[^a-z0-9]/g, ''),
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

      return transformDatabaseArtist(artist as DatabaseArtist);
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
    queryKey: ['artistShows', decodedArtistName],
    queryFn: async () => {
      const response = await fetchArtistEvents(decodedArtistName || '');
      return response.filter(show => 
        show.name.toLowerCase().includes(decodedArtistName?.toLowerCase() || '') &&
        !show.name.toLowerCase().includes('tribute')
      );
    },
    enabled: !!decodedArtistName,
  });

  const isLoading = isLoadingArtist || isLoadingShows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <ArtistHero 
        artist={artist}
        artistName={decodedArtistName}
        isFollowing={isFollowing}
        isFollowActionPending={followMutation.isPending || unfollowMutation.isPending}
        onFollowClick={handleFollowClick}
      />
      <ArtistShows shows={shows} />
    </div>
  );
}
