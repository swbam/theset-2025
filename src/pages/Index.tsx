
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/search/SearchBar";
import { PopularTours } from "@/components/shows/PopularTours";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, signInWithSpotify } = useAuth();
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    // Remove special characters and normalize spaces
    const encodedName = artistName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    console.log('Navigating to artist:', encodedName);
    navigate(`/artist/${encodedName}`);
  };

  return (
    <div className="min-h-full p-6 space-y-12">
      <div className="flex flex-col space-y-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="p-3 rounded-full bg-white/5 w-fit mx-auto">
            <Music2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mt-4 sm:text-5xl xl:text-6xl">
            Vote for Your Concert Setlist
          </h1>
          <p className="mt-4 text-zinc-400 md:text-xl">
            Search for your favorite artists, discover upcoming shows, and vote on the songs you want to hear live.
          </p>
          {!user && (
            <Button
              onClick={signInWithSpotify}
              className="mt-6 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              Sign in with Spotify
            </Button>
          )}
        </div>
        
        <SearchBar onArtistClick={handleArtistClick} />
      </div>

      <div className="max-w-7xl mx-auto">
        <PopularTours onArtistClick={handleArtistClick} />
      </div>
    </div>
  );
};

export default Index;
