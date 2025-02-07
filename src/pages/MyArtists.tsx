
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/shows/LoadingState";
import { ArtistFollowCard } from "@/components/artists/ArtistFollowCard";

interface FollowedArtist {
  artists: {
    id: string;
    name: string;
    image_url: string | null;
    genres: string[] | null;
  };
  created_at: string;
}

const MyArtists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: followedArtists, isLoading } = useQuery({
    queryKey: ["followedArtists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_artists")
        .select(`
          created_at,
          artists (
            id,
            name,
            image_url,
            genres
          )
        `)
        .eq("user_id", user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FollowedArtist[];
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
      <div className="min-h-screen flex w-full bg-black">
        <DashboardSidebar />
        <SidebarInset>
          <div className="w-full max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-8">My Artists</h1>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-accent/20 rounded-lg animate-pulse" />
                ))
              ) : followedArtists?.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No artists followed yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Follow artists to get updates about their shows and setlists
                  </p>
                </div>
              ) : (
                followedArtists?.map((item) => (
                  <ArtistFollowCard
                    key={item.artists.id}
                    name={item.artists.name}
                    imageUrl={item.artists.image_url}
                    followingSince={item.created_at}
                    onClick={() => navigate(`/artist/${item.artists.name.replace(/\s+/g, '-').toLowerCase()}`)}
                  />
                ))
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MyArtists;
