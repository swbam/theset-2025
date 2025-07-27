import { TopNavigation } from "@/components/layout/TopNavigation";
import { PopularTours } from "@/components/shows/PopularTours";
import { Footer } from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";

export default function Artists() {
  const navigate = useNavigate();

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <TopNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Featured Artists</h1>
          <p className="text-xl text-zinc-400">
            Discover artists with upcoming shows and vote on their setlists
          </p>
        </div>
        
        <PopularTours onArtistClick={handleArtistClick} />
      </div>
      <Footer />
    </div>
  );
}
