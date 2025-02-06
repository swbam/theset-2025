
import { useEffect, useState } from "react";
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

interface FollowedArtist {
  artists: {
    id: string;
    name: string;
    image_url: string | null;
  };
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
          artists (
            id,
            name,
            image_url
          )
        `)
        .eq("user_id", user?.id);

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
          <div className="h-full p-6">
            <h1 className="text-2xl font-bold mb-6">My Artists</h1>
            
            <div className="bg-black/50 rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artist</TableHead>
                    <TableHead>Latest Activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : followedArtists?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No artists followed yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    followedArtists?.map((item) => (
                      <TableRow 
                        key={item.artists.id}
                        className="cursor-pointer"
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
                          Following since {new Date().toLocaleDateString()}
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
