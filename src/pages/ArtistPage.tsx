import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';
import { ArtistHero } from '@/components/artists/ArtistHero';
import { ArtistShows } from '@/components/artists/ArtistShows';
import { LoadingState } from '@/components/shows/LoadingState';
import { fetchArtistEvents } from '@/integrations/ticketmaster/artists';
<<<<<<< HEAD
import { fromSlug, toSlug, createShowSlug } from '@/utils/slug';
=======
import { searchArtist, getArtistTopTracks } from '@/integrations/spotify/client';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
>>>>>>> origin/main

export default function ArtistPage() {
  const { artistSlug } = useParams<{ artistSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const location = useLocation();

  const decodedArtistName = artistSlug ? fromSlug(artistSlug) : '';

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

      // If not in DB, trigger server-side sync which will upsert securely
      try {
        await supabase.functions.invoke('auto-sync-artist', {
          body: { artistName: decodedArtistName },
        });
      } catch (err) {
        console.error('auto-sync-artist failed', err);
      }

      // Re-query after sync attempt
      const { data: syncedArtist } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', decodedArtistName)
        .maybeSingle();

      return syncedArtist;
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
    // Create SEO-friendly show slug with venue, city, state, date
    const showId = show.ticketmaster_id || show.id;
    if (showId) {
      const artistName = artistData?.name || decodedArtistName;
      const venueName = show.venue_name || show._embedded?.venues?.[0]?.name || 'venue';
      const showDate = show.date || show.dates?.start?.dateTime;
      const venueLocation = show.venue_location || show._embedded?.venues?.[0];
      const city = venueLocation?.city?.name || 'city';
      const state = venueLocation?.state?.name || venueLocation?.state?.stateCode || 'state';
      
      if (showDate) {
        const showSlug = createShowSlug(artistName, venueName, city, state, showDate);
        navigate(`/show/${showSlug}?id=${showId}`);
      } else {
        // Fallback for shows without dates
        const showSlug = toSlug(`${artistName} ${venueName} ${city} ${state}`);
        navigate(`/show/${showSlug}?id=${showId}`);
      }
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
      <Helmet>
        <title>{`${artistData?.name} concerts — Vote on setlist | TheSet`}</title>
        <meta name="description" content={`Explore ${artistData?.name} upcoming shows and vote on the setlist.`} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}`} />
      </Helmet>
      
      {/* Hero Section */}
      <ArtistHero
        artist={artistData as any}
        artistName={artistData.name}
        showCount={shows?.length || 0}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ArtistShows
          shows={shows || []}
          isLoading={showsLoading || isLoadingShows}
          onShowClick={handleShowClick}
        />
      </div>
      
      <Footer />
    </div>
  );
}

// Inside component before return maybe after data load but let's add rendering modifications
