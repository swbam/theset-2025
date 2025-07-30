import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { ArtistHero } from '@/components/artists/ArtistHero';
import { ArtistShows } from '@/components/artists/ArtistShows';
import { ArtistFollowCard } from '@/components/artists/ArtistFollowCard';
import { LoadingState } from '@/components/shows/LoadingState';
import { fetchArtistEvents } from '@/integrations/ticketmaster/artists';
import { searchArtist, getArtistTopTracks } from '@/integrations/spotify/client';

export default function ArtistPage() {
  const { artistName } = useParams<{ artistName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoadingShows, setIsLoadingShows] = useState(true);

  const decodedArtistName = artistName ? decodeURIComponent(artistName) : '';

  // Query for artist data from our database
  const { data: artistData, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', decodedArtistName],
    queryFn: async () => {
      if (!decodedArtistName) return null;

      // First check if artist exists in our database
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', decodedArtistName)
        .maybeSingle();

      if (existingArtist) {
        return existingArtist;
      }

      // If not in database, search Spotify and create artist record
      try {
        const spotifyArtist = await searchArtist(decodedArtistName);
        if (!spotifyArtist) {
          throw new Error('Artist not found on Spotify');
        }

        // Create artist record in our database
        const { data: newArtist, error } = await supabase
          .from('artists')
          .insert({
            name: spotifyArtist.name,
            spotify_id: spotifyArtist.id,
            image_url: spotifyArtist.images?.[0]?.url,
            genres: spotifyArtist.genres || [],
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating artist:', error);
          return spotifyArtist;
        }

        return newArtist;
      } catch (error) {
        console.error('Error fetching artist:', error);
        throw error;
      }
    },
    enabled: !!decodedArtistName,
  });

  // Query for artist shows
  const { data: shows, isLoading: showsLoading } = useQuery({
    queryKey: ['artist-shows', decodedArtistName],
    queryFn: async () => {
      if (!decodedArtistName) return [];
      
      setIsLoadingShows(true);
      try {
        const events = await fetchArtistEvents(decodedArtistName);
        return events || [];
      } catch (error) {
        console.error('Error fetching artist shows:', error);
        toast({
          title: 'Error',
          description: 'Failed to load shows for this artist',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsLoadingShows(false);
      }
    },
    enabled: !!decodedArtistName,
  });

  const handleShowClick = (show: any) => {
    if (show.ticketmaster_id) {
      navigate(`/show/${show.ticketmaster_id}`);
    } else if (show.id) {
      navigate(`/show/${show.id}`);
    } else {
      toast({
        title: 'Show Not Available',
        description: 'This show cannot be viewed at the moment',
        variant: 'destructive',
      });
    }
  };

  if (artistLoading) {
    return <LoadingState />;
  }

  if (!artistData) {
    return (
      <div className="min-h-screen bg-black">
        <TopNavigation />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
            <p className="text-zinc-400 mb-6">
              The artist "{decodedArtistName}" could not be found.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-primary text-black px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <ArtistHero
              artist={artistData as any}
              artistName={artistData.name}
              isFollowing={false}
              isFollowActionPending={false}
              onFollowClick={() => {}}
            />
            
            <ArtistShows
              shows={shows || []}
              isLoading={showsLoading || isLoadingShows}
              onShowClick={handleShowClick}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ArtistFollowCard
              name={artistData.name}
              imageUrl={
                'image_url' in artistData 
                  ? artistData.image_url 
                  : (artistData as any).images?.[0]?.url || null
              }
              followingSince={new Date().toISOString()}
              showCount={shows?.length || 0}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}