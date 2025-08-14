import { supabase } from '@/integrations/supabase/client';

// Search for artists using our database and Ticketmaster API
export const searchArtists = async (query: string) => {
  console.log('searchArtists: Searching for artists:', query);
  
  if (!query.trim()) {
    return [];
  }

  try {
    // First search our database
    const { data: dbArtists, error: dbError } = await supabase
      .from('artists')
      .select('id, name, image_url, ticketmaster_id')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (dbError) {
      console.error('Database search error:', dbError);
    }

    const results = dbArtists || [];

    // If we have fewer than 5 results, search Ticketmaster
    if (results.length < 5) {
      try {
        const { data: tmResponse, error: tmError } = await supabase.functions.invoke('ticketmaster', {
          body: { 
            endpoint: 'search', 
            query: query,
            params: { size: '20' }
          }
        });

        if (tmError) {
          console.error('Ticketmaster search error:', tmError);
        } else if (tmResponse?.data?._embedded?.events) {
          // Extract unique artists from events
          const uniqueArtists = new Map<string, any>();

          tmResponse.data._embedded.events.forEach((event: any) => {
            const artist = event._embedded?.attractions?.[0];
            if (artist && artist.id && artist.name) {
              const normalizedName = artist.name.toLowerCase().trim();
              if (!uniqueArtists.has(normalizedName)) {
                uniqueArtists.set(normalizedName, {
                  id: artist.id,
                  name: artist.name,
                  image_url: artist.images?.[0]?.url || event.images?.[0]?.url,
                  ticketmaster_id: artist.id,
                });
              }
            }
          });

          // Add Ticketmaster results that aren't already in our DB
          const existingNames = new Set(results.map(r => r.name.toLowerCase()));
          Array.from(uniqueArtists.values()).forEach(artist => {
            if (!existingNames.has(artist.name.toLowerCase()) && results.length < 15) {
              results.push(artist);
            }
          });
        }
      } catch (tmError) {
        console.error('Ticketmaster API call failed:', tmError);
      }
    }

    return results.slice(0, 15);
  } catch (error) {
    console.error('Error in searchArtists:', error);
    return [];
  }
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);

  try {
    // First check our database for cached shows
    const { data: artist } = await supabase
      .from('artists')
      .select('id')
      .ilike('name', artistName)
      .maybeSingle();

    if (artist) {
      const { data: shows } = await supabase
        .from('cached_shows')
        .select('*')
        .eq('artist_id', artist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (shows && shows.length > 0) {
        console.log('Found shows in database:', shows.length);
        return shows;
      }
    }

    // Fallback to Ticketmaster API
    try {
      const { data: tmResponse, error } = await supabase.functions.invoke('ticketmaster', {
        body: { 
          endpoint: 'artist-events', 
          query: artistName,
          params: { size: '50' }
        }
      });

      if (error) {
        console.error('Ticketmaster API error:', error);
        return [];
      }

      const events = tmResponse?.data?._embedded?.events || [];
      console.log('Fetched events from Ticketmaster:', events.length);

      // Trigger background sync for this artist
      if (events.length > 0) {
        supabase.functions.invoke('auto-sync-artist', {
          body: { artistName }
        }).catch(err => console.error('Auto-sync failed:', err));
      }

      return events;
    } catch (tmError) {
      console.error('Ticketmaster fallback failed:', tmError);
      return [];
    }

  } catch (error) {
    console.error('Error in fetchArtistEvents:', error);
    return [];
  }
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  
  try {
    // First try to get from our database
    const { data: dbShows } = await supabase
      .from('cached_shows')
      .select('*')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(100);

    if (dbShows && dbShows.length > 20) {
      console.log('Using cached shows from database:', dbShows.length);
      return dbShows;
    }

    // Fallback to Ticketmaster API
    const { data: response, error } = await supabase.functions.invoke('ticketmaster', {
      body: { 
        endpoint: 'featured',
        params: { 
          size: '100', 
          countryCode: 'US' 
        }
      }
    });

    if (error) {
      console.error('Error fetching popular tours:', error);
      return dbShows || [];
    }

    const events = response?.data?._embedded?.events || [];
    console.log('Fetched popular tours from Ticketmaster:', events.length);

    // Trigger background sync
    if (events.length > 0) {
      supabase.functions.invoke('sync-popular-tours', {
        body: { shows: events }
      }).catch(err => console.error('Background sync failed:', err));
    }

    return events;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};