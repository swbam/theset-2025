import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Vote, Music } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Footer } from '@/components/layout/Footer';

interface UserVote {
  id: string;
  created_at: string;
  song_id: string;
  // We'll need to join with setlist_songs to get song details
}

interface VoteActivity {
  id: string;
  created_at: string;
  song_name: string;
  artist_name?: string;
  show_date?: string;
}

export default function MyActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voteHistory, setVoteHistory] = useState<VoteActivity[]>([]);
  const [followedCount, setFollowedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    if (!user) return;

    try {
      // Fetch user votes with song details
      const { data: votes, error } = await supabase
        .from('user_votes')
        .select(`
          id,
          created_at,
          song_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch followed artists count
      const { count: followedArtistsCount } = await supabase
        .from('user_artists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setFollowedCount(followedArtistsCount || 0);

      // For now, just show basic vote data
      // In a full implementation, you'd join with setlist_songs to get song names
      const activities: VoteActivity[] = votes?.map(vote => ({
        id: vote.id,
        created_at: vote.created_at,
        song_name: 'Song Vote', // Placeholder - would need proper join
        artist_name: undefined,
        show_date: undefined,
      })) || [];

      setVoteHistory(activities);
    } catch (error: any) {
      console.error('Error fetching user activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your activity',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 py-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2 text-white">
              <Activity className="h-8 w-8" />
              My Activity
            </h1>
            <p className="text-zinc-400">
              Your voting history and setlist interactions
            </p>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{voteHistory.length}</div>
                <p className="text-xs text-zinc-400">
                  All time votes cast
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white">Artists Followed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{followedCount}</div>
                <p className="text-xs text-zinc-400">
                  Artists you follow
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white">Shows Participated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">-</div>
                <p className="text-xs text-zinc-400">
                  Shows you've voted on
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Vote className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your latest votes and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voteHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
                  <p className="text-zinc-400">No activity yet</p>
                  <p className="text-sm text-zinc-500">
                    Start voting on setlists to see your activity here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {voteHistory.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Vote className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Voted on a song</p>
                          <p className="text-sm text-zinc-400">
                            {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Vote</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}