
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "@/integrations/ticketmaster/types";

export const useArtistData = (normalizedArtistName: string) => {
  return useQuery({
    queryKey: ['artist', normalizedArtistName],
    queryFn: async () => {
      if (!normalizedArtistName) throw new Error('Artist name is required');
      
      console.log('Fetching artist:', normalizedArtistName);
      
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', normalizedArtistName)
        .maybeSingle();

      if (existingArtist) {
        console.log('Found existing artist:', existingArtist);
        
        const { data: needsRefresh } = await supabase
          .rpc('needs_artist_refresh', {
            last_sync: existingArtist.last_synced_at,
            ttl_hours: 1
          });

        if (!needsRefresh) {
          return existingArtist as Artist;
        }
        
        console.log('Artist data needs refresh');
      }

      console.log('Creating/updating artist:', normalizedArtistName);
      const { data: artist, error: insertError } = await supabase
        .from('artists')
        .upsert({
          name: normalizedArtistName,
          spotify_id: normalizedArtistName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          last_synced_at: new Date().toISOString(),
          genres: []
        }, {
          onConflict: 'spotify_id',
          ignoreDuplicates: false
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error creating/updating artist:', insertError);
        throw insertError;
      }

      return artist as Artist;
    },
    retry: false,
  });
};
