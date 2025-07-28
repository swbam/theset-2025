import { TopNavigation } from '@/components/layout/TopNavigation';
import { PopularTours } from '@/components/shows/PopularTours';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';

export default function Shows() {
  const navigate = useNavigate();

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

        {/* Genre filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            'All Genres',
            'Rock',
            'Pop',
            'Electronic',
            'R&B',
            'Folk',
            'Country',
          ].map((genre) => (
            <Button
              key={genre}
              variant="outline"
              size="sm"
              className="text-sm text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            >
              {genre}
            </Button>
          ))}
        </div>

        <PopularTours onArtistClick={handleArtistClick} />
      </div>
      <Footer />
    </div>
  );
}
