
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { ArtistFollowCard } from "@/components/artists/ArtistFollowCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/mobile/MobileNav";

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
  const isMobile = useIsMobile();

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
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        {!isMobile && <DashboardSidebar />}
        <SidebarInset className="flex-1">
          {isMobile && (
            <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center px-4">
                <div className="flex flex-1 items-center justify-between">
                  <h2 className="text-lg font-semibold">My Artists</h2>
                  <MobileNav />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 max-w-[2000px] mx-auto px-4 md:px-8 pt-6">
            {!isMobile && (
              <h1 className="text-3xl font-bold mb-8">My Artists</h1>
            )}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
