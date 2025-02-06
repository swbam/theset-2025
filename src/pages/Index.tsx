
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SearchBar } from "@/components/search/SearchBar";
import { FeaturedShows } from "@/components/shows/FeaturedShows";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-black to-zinc-900">
        <DashboardSidebar />
        <SidebarInset>
          <div className="h-full p-6">
            <div className="flex flex-col space-y-8 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="p-3 rounded-full bg-white/5 w-fit mx-auto">
                  <Music2 className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold tracking-tighter mt-4 sm:text-5xl">
                  Vote for Your Concert Setlist
                </h1>
                <p className="mt-4 text-zinc-400 md:text-xl">
                  Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
                </p>
              </div>
              
              <SearchBar onArtistClick={handleArtistClick} />
            </div>

            <div className="mt-24 space-y-12">
              <h2 className="text-2xl font-semibold tracking-tight">Top Stadium Tours & Arena Shows</h2>
              <FeaturedShows onArtistClick={handleArtistClick} />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
