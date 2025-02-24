
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { searchArtists } from "@/integrations/ticketmaster/client";
import { getTopArtists, getFollowedArtists } from "@/integrations/spotify/client";

export function RecommendedShows() {
  const { session } = useAuth();
  const spotifyToken = session?.provider_token;

  const { data: recommendedShows, isLoading } = useQuery({
    queryKey: ["recommendedShows", spotifyToken],
    queryFn: async () => {
      if (!spotifyToken) return [];
      
      // Get user's top and followed artists from Spotify
      const [topArtists, followedArtists] = await Promise.all([
        getTopArtists(spotifyToken),
        getFollowedArtists(spotifyToken)
      ]);

      // Combine and deduplicate artists
      const uniqueArtists = [...new Set([...topArtists, ...followedArtists].map(a => a.name))];
      
      // Search for shows for each artist
      const showPromises = uniqueArtists.slice(0, 5).map(artist => searchArtists(artist));
      const showResults = await Promise.all(showPromises);
      
      // Flatten and sort by date
      return showResults
        .flat()
        .sort((a, b) => new Date(a.dates.start.dateTime).getTime() - new Date(b.dates.start.dateTime).getTime())
        .slice(0, 6);
    },
    enabled: !!spotifyToken,
  });

  if (isLoading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendedShows?.map((show) => (
        <Card key={show.url} className="overflow-hidden">
          <a href={show.url} target="_blank" rel="noopener noreferrer">
            <div className="aspect-video relative">
              <img
                src={show.images?.[0]?.url || "/placeholder.svg"}
                alt={show.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">{show.name}</h3>
              <p className="text-sm text-zinc-400">
                {new Date(show.dates.start.dateTime).toLocaleDateString()}
              </p>
              <p className="text-sm text-zinc-400">
                {show._embedded?.venues?.[0]?.name}
              </p>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}
