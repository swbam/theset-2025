
// Create a new file for MyActivity with proper type handling
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SetlistActivity, VoteActivity } from "@/types/sync";

export default function MyActivity() {
  const { user } = useAuth();

  // Fetch setlist activities
  const { data: setlistActivities, isLoading: isLoadingSetlists } = useQuery({
    queryKey: ['setlistActivities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('setlists')
          .select(`
            id,
            created_at,
            title:name,
            shows (
              artist_name:artists(name),
              venue:venues(name)
            )
          `)
          .limit(5)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching setlist activities:', error);
          return [];
        }
        
        // Transform and validate the data
        const activities: SetlistActivity[] = [];
        
        data?.forEach(item => {
          if (item && item.id) {
            activities.push({
              id: item.id,
              created_at: item.created_at || new Date().toISOString(),
              name: item.title || 'Unnamed Setlist',
              shows: {
                artist_name: item.shows?.artist_name?.name || 'Unknown Artist',
                venue: item.shows?.venue?.name || 'Unknown Venue'
              }
            });
          }
        });
        
        return activities;
      } catch (err) {
        console.error('Error fetching setlist activities:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch vote activities
  const { data: voteActivities, isLoading: isLoadingVotes } = useQuery({
    queryKey: ['voteActivities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('user_votes')
          .select(`
            id,
            created_at,
            songs:song_id (
              title:name,
              setlist:shows (
                name,
                artist:artists(name),
                venue:venues(name)
              )
            )
          `)
          .eq('user_id', user.id)
          .limit(5)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching vote activities:', error);
          return [];
        }
        
        // Transform and validate the data
        const activities: VoteActivity[] = [];
        
        data?.forEach(item => {
          if (item && item.id && item.songs) {
            activities.push({
              id: item.id,
              created_at: item.created_at || new Date().toISOString(),
              setlist_songs: {
                song_name: item.songs?.title || 'Unknown Song',
                setlist: {
                  name: item.songs?.setlist?.name || 'Unknown Setlist',
                  shows: {
                    artist_name: item.songs?.setlist?.artist?.name || 'Unknown Artist',
                    venue: item.songs?.setlist?.venue?.name || 'Unknown Venue'
                  }
                }
              }
            });
          }
        });
        
        return activities;
      } catch (err) {
        console.error('Error fetching vote activities:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  const isLoading = isLoadingSetlists || isLoadingVotes;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white/60">
        <p>Please sign in to view your activity.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const hasActivity = (setlistActivities && setlistActivities.length > 0) || 
                     (voteActivities && voteActivities.length > 0);

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh] text-white/60">
        <Music className="w-16 h-16" />
        <div className="text-center">
          <h3 className="text-xl font-medium text-white">No activity yet</h3>
          <p className="mt-1">Follow artists and vote on setlists to see your activity here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>

        <div className="space-y-4">
          {voteActivities && voteActivities.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-white/80">Song Votes</h3>
              <div className="grid grid-cols-1 gap-4">
                {voteActivities.map((activity) => (
                  <Card key={activity.id} className="bg-black/20 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-sm text-white/60">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      <div className="mt-2 text-white font-medium">
                        Voted for <span className="text-green-400">{activity.setlist_songs.song_name}</span>
                      </div>
                      <div className="mt-1 text-white/80">
                        {activity.setlist_songs.setlist.shows.artist_name} at {activity.setlist_songs.setlist.shows.venue}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {setlistActivities && setlistActivities.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-white/80 mt-8">Setlists</h3>
              <div className="grid grid-cols-1 gap-4">
                {setlistActivities.map((activity) => (
                  <Card key={activity.id} className="bg-black/20 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-sm text-white/60">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      <div className="mt-2 text-white font-medium">
                        Created setlist for <span className="text-green-400">{activity.shows.artist_name}</span>
                      </div>
                      <div className="mt-1 text-white/80">
                        {activity.shows.venue}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
