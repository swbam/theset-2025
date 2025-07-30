import { TopNavigation } from '@/components/layout/TopNavigation';
import { PopularTours } from '@/components/shows/PopularTours';
import { Footer } from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchPopularTours } from '@/integrations/ticketmaster/artists';
import { useToast } from '@/hooks/use-toast';

export default function Shows() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shows, setShows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const data = await fetchPopularTours();
        setShows(data || []);
      } catch (error) {
        console.error('Error loading shows:', error);
        toast({
          title: 'Error',
          description: 'Failed to load shows. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadShows();
  }, [toast]);

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Upcoming Shows</h1>
          <p className="text-xl text-zinc-400">
            Browse upcoming concerts and vote on setlists
          </p>
        </div>

        <PopularTours onArtistClick={handleArtistClick} shows={shows} isLoading={isLoading} />
      </div>
      <Footer />
    </div>
  );
}