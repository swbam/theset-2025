
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type { SetlistActivity, VoteActivity } from "@/types/activity";

const MyActivity = () => {
  const { user } = useAuth();

  const { data: setlistActivities = [] } = useQuery({
    queryKey: ["setlistActivities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setlists')
        .select(`
          id,
          created_at,
          name,
          shows:shows (
            artist:artists (name),
            venue_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        name: item.name || 'Untitled Setlist',
        shows: {
          artist_name: item.shows?.artist?.name || 'Unknown Artist',
          venue: item.shows?.venue_name || 'Unknown Venue'
        }
      })) as SetlistActivity[];
    },
    enabled: !!user
  });

  const { data: voteActivities = [] } = useQuery({
    queryKey: ["voteActivities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_votes')
        .select(`
          id,
          created_at,
          songs:songs (
            name,
            setlist:setlists (
              name,
              shows:shows (
                artist:artists (name),
                venue:venues (name)
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        setlist_songs: {
          song_name: item.songs?.name || 'Unknown Song',
          setlist: {
            name: item.songs?.setlist?.name || 'Unknown Setlist',
            shows: {
              artist_name: item.songs?.setlist?.shows?.artist?.name || 'Unknown Artist',
              venue: item.songs?.setlist?.shows?.venue?.name || 'Unknown Venue'
            }
          }
        }
      })) as VoteActivity[];
    },
    enabled: !!user
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black">
        <DashboardSidebar />
        <SidebarInset>
          <div className="w-full max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-8">My Activity</h1>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Recent Setlists</h2>
                {setlistActivities.length === 0 ? (
                  <p className="text-muted-foreground">No recent setlist activity</p>
                ) : (
                  <div className="space-y-4">
                    {setlistActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="p-4 rounded-lg bg-card border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{activity.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {activity.shows.artist_name} at {activity.shows.venue}
                            </p>
                          </div>
                          <time className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Recent Votes</h2>
                {voteActivities.length === 0 ? (
                  <p className="text-muted-foreground">No recent voting activity</p>
                ) : (
                  <div className="space-y-4">
                    {voteActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="p-4 rounded-lg bg-card border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              {activity.setlist_songs.song_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {activity.setlist_songs.setlist.name} • 
                              {activity.setlist_songs.setlist.shows.artist_name} at {activity.setlist_songs.setlist.shows.venue}
                            </p>
                          </div>
                          <time className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MyActivity;
