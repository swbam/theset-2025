
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ShowPage() {
  const { id } = useParams();
  
  const { data: show, isLoading } = useQuery({
    queryKey: ['show', id],
    queryFn: async () => {
      const { data: show } = await supabase
        .from('cached_shows')
        .select('*')
        .eq('ticketmaster_id', id)
        .maybeSingle();
      
      return show;
    },
    enabled: !!id,
  });

  if (isLoading) {
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
              <p>{show.venue_name}</p>
              {show.venue_location?.city?.name && show.venue_location?.state?.name && (
                <p>{show.venue_location.city.name}, {show.venue_location.state.name}</p>
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
            <p className="text-white/60">The setlist for this show will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
