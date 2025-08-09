import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchPopularTours } from '@/integrations/ticketmaster/client';
import { toSlug } from '@/utils/slug';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardHome() {
  const { user, isSpotifyUser } = useAuth();
  const navigate = useNavigate();

  const { data: popularShows = [], isLoading } = useQuery({
    queryKey: ['popularTours'],
    queryFn: fetchPopularTours,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">
          Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {isSpotifyUser 
            ? "Your personalized music experience awaits. Check out upcoming shows from your favorite artists."
            : "Discover new artists and vote on setlists for upcoming shows in your area."
          }
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Your Votes
            </CardTitle>
            <Music2 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-xs text-zinc-500 mt-1">
              Start voting on setlists
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Trending Shows
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {popularShows.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Shows with active voting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Upcoming Shows
            </CardTitle>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {popularShows.filter(show => 
                new Date(show.dates?.start?.dateTime || '') > new Date()
              ).length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              In the next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/artists')}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <Music2 className="w-6 h-6" />
            <span>Browse Artists</span>
          </Button>

          <Button
            onClick={() => navigate('/shows')}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <Calendar className="w-6 h-6" />
            <span>View Shows</span>
          </Button>

          {isSpotifyUser && (
            <Button
              onClick={() => navigate('/dashboard/my-artists')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              <TrendingUp className="w-6 h-6" />
              <span>My Artists</span>
            </Button>
          )}

          <Button
            onClick={() => navigate('/how-it-works')}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
          >
            <Music2 className="w-6 h-6" />
            <span>How It Works</span>
          </Button>
        </div>
      </div>

      {/* Recommended Shows */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {isSpotifyUser ? 'Recommended for You' : 'Trending Shows'}
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate('/shows')}
            className="text-zinc-400 border-zinc-700"
          >
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-800 animate-pulse rounded-lg" />
            ))
          ) : popularShows.length > 0 ? (
            popularShows.slice(0, 6).map((show: any) => (
              <div
                key={show.id}
                className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
                onClick={() => {
                  const artist = show._embedded?.attractions?.[0];
                  if (artist?.name) {
                    navigate(`/artist/${toSlug(artist.name)}`);
                  }
                }}
              >
                {show.images?.[0]?.url && (
                  <div 
                    className="w-full h-32 bg-cover bg-center rounded-lg mb-3"
                    style={{ backgroundImage: `url(${show.images[0].url})` }}
                  />
                )}
                <h3 className="text-white font-semibold mb-1 truncate">{show.name}</h3>
                <p className="text-zinc-400 text-sm mb-2 truncate">
                  {show._embedded?.attractions?.[0]?.name}
                </p>
                <p className="text-zinc-500 text-xs">
                  {show._embedded?.venues?.[0]?.name}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-zinc-500">No shows found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}