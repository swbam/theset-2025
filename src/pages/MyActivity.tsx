
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shows/LoadingState";
import { format } from "date-fns";
import { toast } from "sonner";

interface SetlistActivity {
  id: string;
  created_at: string;
  name: string;
  shows: {
    artist_name: string;
    venue: string;
  } | null;
}

interface VoteActivity {
  id: string;
  created_at: string;
  setlist_songs: {
    song_name: string;
    setlist: {
      name: string;
      shows: {
        artist_name: string;
        venue: string;
      } | null;
    } | null;
  } | null;
}

const MyActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: setlists, isLoading: isLoadingSetlists } = useQuery({
    queryKey: ["userSetlists", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("setlists")
          .select(`
            id,
            created_at,
            name,
            shows (
              artist_name,
              venue
            )
          `)
          .eq("created_by", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as SetlistActivity[];
      } catch (error) {
        console.error("Error fetching setlists:", error);
        toast.error("Failed to load your setlists");
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: votes, isLoading: isLoadingVotes } = useQuery({
    queryKey: ["userVotes", user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("user_votes")
          .select(`
            id,
            created_at,
            setlist_songs (
              song_name,
              setlist (
                name,
                shows (
                  artist_name,
                  venue
                )
              )
            )
          `)
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as VoteActivity[];
      } catch (error) {
        console.error("Error fetching votes:", error);
        toast.error("Failed to load your votes");
        return [];
      }
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
          <div className="w-full max-w-7xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">My Activity</h1>
              <p className="text-lg text-muted-foreground">
                View your saved setlists and voting history
              </p>
            </div>

            <Tabs defaultValue="setlists" className="space-y-6">
              <TabsList className="bg-background/10 backdrop-blur-sm">
                <TabsTrigger value="setlists">Saved Setlists</TabsTrigger>
                <TabsTrigger value="votes">My Votes</TabsTrigger>
              </TabsList>

              <TabsContent value="setlists" className="space-y-4">
                {isLoadingSetlists ? (
                  <LoadingState />
                ) : !setlists?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No setlists saved yet</p>
                    <p className="text-sm mt-1">
                      Create a setlist for your favorite artists' shows
                    </p>
                  </div>
                ) : (
                  setlists?.map((setlist) => (
                    <div
                      key={setlist.id}
                      className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm space-y-2"
                    >
                      <h3 className="text-xl font-semibold">{setlist.shows?.artist_name}</h3>
                      <p className="text-muted-foreground">
                        {setlist.shows?.venue}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Saved on {format(new Date(setlist.created_at), 'M/d/yyyy')}
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/setlist/${setlist.id}`)}
                        >
                          View Setlist
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="votes" className="space-y-4">
                {isLoadingVotes ? (
                  <LoadingState />
                ) : !votes?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No votes yet</p>
                    <p className="text-sm mt-1">
                      Vote on songs in setlists to help predict show setlists
                    </p>
                  </div>
                ) : (
                  votes?.map((vote) => (
                    <div
                      key={vote.id}
                      className="p-6 rounded-lg bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm space-y-2"
                    >
                      <h3 className="text-xl font-semibold">
                        {vote.setlist_songs?.setlist?.shows?.artist_name}
                      </h3>
                      <p className="text-muted-foreground">
                        {vote.setlist_songs?.setlist?.shows?.venue}
                      </p>
                      <p className="text-sm">
                        Voted for "{vote.setlist_songs?.song_name}"
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Voted on {format(new Date(vote.created_at), 'M/d/yyyy')}
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/setlist/${vote.setlist_songs?.setlist?.id}`)}
                        >
                          View Setlist
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MyActivity;
