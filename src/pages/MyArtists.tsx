
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingState } from "@/components/shows/LoadingState";

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
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        <DashboardSidebar />
        <SidebarInset>
          <div className="w-full max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-8">My Artists</h1>
            
            {!followedArtists?.length && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Recommended Artists</h2>
              </div>
            )}

            <div className="bg-black/50 rounded-lg border border-zinc-800 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artist</TableHead>
                    <TableHead>Genres</TableHead>
                    <TableHead>Following Since</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <LoadingState />
                      </TableCell>
                    </TableRow>
                  ) : followedArtists?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <p className="text-muted-foreground">No artists followed yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Follow artists to get updates about their shows and setlists
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    followedArtists?.map((item) => (
                      <TableRow 
                        key={item.artists.id}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => navigate(`/artist/${encodeURIComponent(item.artists.name)}`)}
                      >
                        <TableCell className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={item.artists.image_url || ''} />
                            <AvatarFallback>
                              {item.artists.name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{item.artists.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {item.artists.genres?.slice(0, 2).map((genre: string) => (
                              <span 
                                key={genre}
                                className="px-2 py-1 rounded-full text-xs bg-white/10"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                            Following
                          </span>
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

export default MyArtists;
