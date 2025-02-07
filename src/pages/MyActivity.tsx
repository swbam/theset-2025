
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/mobile/MobileNav";
import { SavedSetlists } from "@/components/activity/SavedSetlists";
import { UserVotes } from "@/components/activity/UserVotes";

const MyActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        return data;
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
            setlist_songs!user_votes_song_id_fkey (
              song_name,
              setlists!setlist_songs_setlist_id_fkey (
                id,
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
        return data;
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
        {!isMobile && <DashboardSidebar />}
        <SidebarInset className="flex-1">
          {isMobile && (
            <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center px-4">
                <div className="flex flex-1 items-center justify-between">
                  <h2 className="text-lg font-semibold">My Activity</h2>
                  <MobileNav />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 max-w-[2000px] mx-auto px-4 md:px-8 pt-6">
            {!isMobile && (
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Activity</h1>
                  <p className="text-lg text-muted-foreground">
                    View your saved setlists and voting history
                  </p>
                </div>
              </div>
            )}

            <Tabs defaultValue="setlists" className="space-y-4">
              <TabsList className="bg-background/10 backdrop-blur-sm">
                <TabsTrigger value="setlists">Saved Setlists</TabsTrigger>
                <TabsTrigger value="votes">My Votes</TabsTrigger>
              </TabsList>

              <TabsContent value="setlists" className="space-y-4">
                <SavedSetlists isLoading={isLoadingSetlists} setlists={setlists} />
              </TabsContent>

              <TabsContent value="votes" className="space-y-4">
                <UserVotes isLoading={isLoadingVotes} votes={votes} />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MyActivity;
