
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ArtistHero } from "@/components/artists/ArtistHero";
import { ArtistShows } from "@/components/artists/ArtistShows";
import { useArtistData } from "@/hooks/useArtistData";
import { useArtistFollow } from "@/hooks/useArtistFollow";
import { useArtistShows } from "@/hooks/useArtistShows";
import type { Artist } from "@/integrations/ticketmaster/types";

export default function ArtistPage() {
  const { artistName } = useParams();
  const normalizedArtistName = artistName ? 
    artistName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/[^a-zA-Z0-9\s]/g, '') : '';
  
  const { user } = useAuth();
  
  const { data: artist, isLoading: isLoadingArtist } = useArtistData(normalizedArtistName);
  
  const { 
    isFollowing, 
    isFollowActionPending, 
    handleFollowClick 
  } = useArtistFollow(artist as Artist | null, user);

  const { data: shows, isLoading: isLoadingShows } = useArtistShows(normalizedArtistName, artist?.id);

  const isLoading = isLoadingArtist || isLoadingShows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <ArtistHero 
        artist={artist as Artist}
        artistName={normalizedArtistName}
        isFollowing={isFollowing}
        isFollowActionPending={isFollowActionPending}
        onFollowClick={handleFollowClick}
      />
      <ArtistShows shows={shows} />
    </div>
  );
}
