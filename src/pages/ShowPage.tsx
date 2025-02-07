import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ShowPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', id],
    queryFn: async () => {
      const { data: show } = await supabase
        .from('cached_shows')
        .select(`
          *,
          venue:venues(
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('ticketmaster_id', id)
        .maybeSingle();
      
      return show;
    },
    enabled: !!id,
  });

  const { data: setlist, isLoading: setlistLoading } = useQuery({
    queryKey: ['setlist', show?.id],
    queryFn: async () => {
      const { data: setlist } = await supabase
        .from('setlists')
        .select(`
          *,
          songs:setlist_songs(
            id,
            song_name,
            total_votes,
            suggested
          )
        `)
        .eq('show_id', show?.id)
        .maybeSingle();
      
      return setlist;
    },
    enabled: !!show?.id,
  });

  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', setlist?.id],
    queryFn: async () => {
      const { data: votes } = await supabase
        .from('user_votes')
        .select('song_id')
        .eq('user_id', user?.id);
      
      return votes?.map(v => v.song_id) || [];
    },
    enabled: !!setlist?.id && !!user?.id,
  });

  const handleVote = async (songId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote for songs",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('user_votes')
      .insert({
        user_id: user.id,
        song_id: songId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Vote Submitted",
      description: "Your vote has been recorded"
    });
  };

  if (showLoading || setlistLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Show not found</h1>
        <p className="text-muted-foreground">The show you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">{show.name}</h1>
            <div className="space-y-2 text-white/60">
              {show.venue && (
                <>
                  <p>{show.venue.name}</p>
                  {show.venue.city && show.venue.state && (
                    <p>{show.venue.city}, {show.venue.state}</p>
                  )}
                </>
              )}
              <p>{new Date(show.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Setlist</h2>
            {setlist ? (
              <div className="space-y-4">
                {setlist.songs?.map((song) => (
                  <div 
                    key={song.id} 
                    className="flex items-center justify-between bg-white/5 p-4 rounded-lg"
                  >
                    <div>
                      <p className="text-white">{song.song_name}</p>
                      {song.suggested && (
                        <span className="text-sm text-white/60">Fan suggestion</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">{song.total_votes || 0}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleVote(song.id)}
                        disabled={userVotes?.includes(song.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60">
                <p>The setlist for this show will be available soon.</p>
                {user && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      // TODO: Implement song suggestion
                      toast({
                        title: "Coming Soon",
                        description: "Song suggestions will be available soon!"
                      });
                    }}
                  >
                    Suggest a song
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
