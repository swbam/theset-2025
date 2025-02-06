
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface UserActivity {
  id: string;
  created_at: string;
  type: 'vote' | 'setlist';
  song_name?: string;
  setlist_name?: string;
  artist_name?: string;
}

const MyActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: activityData, isLoading } = useQuery({
    queryKey: ["userActivity", user?.id],
    queryFn: async () => {
      // Fetch votes
      const { data: votes, error: votesError } = await supabase
        .from("user_votes")
        .select(`
          id,
          created_at,
          setlist_songs (
            song_name,
            setlist:setlists (
              name,
              shows (
                artist_name
              )
            )
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (votesError) throw votesError;

      // Fetch setlists
      const { data: setlists, error: setlistsError } = await supabase
        .from("setlists")
        .select(`
          id,
          created_at,
          name,
          shows (
            artist_name
          )
        `)
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (setlistsError) throw setlistsError;

      // Combine and format the activities
      const formattedVotes = votes.map((vote: any) => ({
        id: vote.id,
        created_at: vote.created_at,
        type: 'vote' as const,
        song_name: vote.setlist_songs.song_name,
        setlist_name: vote.setlist_songs.setlist.name,
        artist_name: vote.setlist_songs.setlist.shows.artist_name,
      }));

      const formattedSetlists = setlists.map((setlist: any) => ({
        id: setlist.id,
        created_at: setlist.created_at,
        type: 'setlist' as const,
        setlist_name: setlist.name,
        artist_name: setlist.shows.artist_name,
      }));

      return [...formattedVotes, ...formattedSetlists].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        <DashboardSidebar />
        <SidebarInset>
          <div className="h-full p-6">
            <h1 className="text-2xl font-bold mb-6">My Activity</h1>
            
            <div className="bg-black/50 rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : activityData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No activity yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityData?.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {activity.type === 'vote' ? (
                            <>Voted for "{activity.song_name}" in {activity.setlist_name}</>
                          ) : (
                            <>Created setlist "{activity.setlist_name}"</>
                          )}
                        </TableCell>
                        <TableCell>
                          <span 
                            className="cursor-pointer hover:underline"
                            onClick={() => navigate(`/artist/${encodeURIComponent(activity.artist_name || '')}`)}
                          >
                            {activity.artist_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(activity.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.type === 'vote' ? 'default' : 'secondary'}>
                            {activity.type === 'vote' ? 'Vote' : 'Setlist'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MyActivity;
