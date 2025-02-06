
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signInWithSpotify, signOut } = useAuth();
  const { toast } = useToast();

  const handleSpotifyAuth = async () => {
    try {
      if (user) {
        await signOut();
      } else {
        await signInWithSpotify();
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "There was an error with Spotify authentication.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <div className="container px-4 py-16 mx-auto">
        {/* Nav Section */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={handleSpotifyAuth}
            className="glass-morphism hover:bg-white/20"
            variant="ghost"
          >
            {user ? "Sign Out" : "Sign in with Spotify"}
          </Button>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center animate-fade-in">
          <div className="p-3 rounded-full bg-white/5">
            <Music2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Vote for Your Concert Setlist
          </h1>
          <p className="max-w-[600px] text-zinc-400 md:text-xl dark:text-zinc-400">
            Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
          </p>
          
          {/* Search Section */}
          <div className="w-full max-w-2xl mt-8">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Search artists..."
                className="w-full h-12 pl-12 glass-morphism"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
              <Button 
                className="absolute right-0 h-12 px-6 glass-morphism hover:bg-white/20"
                variant="ghost"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Shows Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Shows</h2>
          <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder cards - will be replaced with real data */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 overflow-hidden rounded-lg hover-card glass-morphism"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800" />
                  <div>
                    <h3 className="font-semibold">Artist Name</h3>
                    <p className="text-sm text-zinc-400">Venue • Date</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
