import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Music, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MyActivity = () => {
  const { user } = useAuth();

  const { data: setlistData = [], isLoading: setlistLoading } = useQuery({
    queryKey: ['user-setlists', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { data, error } = await supabase
          .from('setlists')
          .select(`
            id,
            created_at,
            show_id
          `)
          .limit(10);

        if (error) {
          console.error('Error fetching setlists:', error);
          return [];
        }

        return (data || []).map((item) => ({
          id: item.id,
          created_at: item.created_at,
          title: `Setlist #${item.id.slice(0, 8)}`,
          shows: {
            artist_name: 'Various Artists',
            venue: 'Various Venues',
          },
        }));
      } catch (error) {
        console.error('Error in setlist query:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: voteData = [], isLoading: voteLoading } = useQuery({
    queryKey: ['user-votes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { data, error } = await supabase
          .from('user_votes')
          .select(`
            id,
            created_at,
            song_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching votes:', error);
          return [];
        }

        return (data || []).map((vote) => ({
          id: vote.id,
          created_at: vote.created_at,
          title: `Vote #${vote.id.slice(0, 8)}`,
          setlist_songs: {
            song_name: 'Song',
            setlist: {
              title: 'Setlist',
              shows: {
                artist_name: 'Artist',
                venue: 'Venue',
              },
            },
          },
        }));
      } catch (error) {
        console.error('Error in votes query:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="p-6 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground">
          Please sign in to view your activity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Activity</h1>
        <p className="text-muted-foreground">
          Track your setlist contributions and voting history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Setlists Created */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Setlists Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            {setlistLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : setlistData.length > 0 ? (
              <div className="space-y-3">
                {setlistData.map((setlist) => (
                  <div
                    key={setlist.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <h3 className="font-medium">{setlist.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {setlist.shows.artist_name} at {setlist.shows.venue}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <CalendarDays className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(setlist.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No setlists created yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Votes Cast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Votes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {voteLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : voteData.length > 0 ? (
              <div className="space-y-3">
                {voteData.map((vote) => (
                  <div
                    key={vote.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{vote.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vote.setlist_songs.setlist.shows.artist_name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        Vote
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <CalendarDays className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(vote.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No votes cast yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyActivity;