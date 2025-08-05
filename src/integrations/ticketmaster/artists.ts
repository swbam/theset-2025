import { supabase } from '@/integrations/supabase/client';
import { callTicketmasterFunction } from './api';
import { processShow } from './client';
import type { TicketmasterEvent } from './types';

// Search specifically for artists, not just events
export const searchArtists = async (query: string) => {
  console.log('searchArtists: Searching for artists:', query);
  
  if (!query.trim()) {
    return [];
  }

  try {
    console.log('searchArtists: About to call Ticketmaster function...');
    const results = await callTicketmasterFunction('search', query);
    console.log('searchArtists: Got results:', results);

    // Extract unique artists from events
    const uniqueArtists = new Map<string, any>();

    if (results.data?._embedded?.events) {
      results.data._embedded.events.forEach((event: TicketmasterEvent) => {
        const artist = event._embedded?.attractions?.[0];
        if (artist && artist.id && artist.name) {
          if (!uniqueArtists.has(artist.id)) {
            uniqueArtists.set(artist.id, {
              id: artist.id,
              name: artist.name,
              image_url: artist.images?.[0]?.url || event.images?.[0]?.url,
              ticketmaster_id: artist.id,
              venue: event._embedded?.venues?.[0]?.name,
              date: event.dates?.start?.dateTime,
              url: event.url,
              capacity: event._embedded?.venues?.[0]?.capacity || 0,
            });
          }
        }
      });
    }

    return Array.from(uniqueArtists.values())
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 10);
  } catch (error) {
    console.error('Error searching for artists:', error);
    return [];
  }
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);

  try {
    // Trigger auto-sync for this artist
    const { data: syncResult, error } = await supabase.functions.invoke('auto-sync-artist', {
      body: { artistName, forceSync: false }
    });

    if (error) {
      console.error('Auto-sync failed:', error);
      throw error;
    }

    console.log('Auto-sync result:', syncResult);
    
    // Return the shows from the sync result
    return syncResult?.data?.shows || [];

  } catch (error) {
    console.error('Error in fetchArtistEvents:', error);
    
    // Fallback: try to get from database
    const { data: artist } = await supabase
      .from('artists')
      .select('id')
      .ilike('name', artistName)
      .maybeSingle();

    if (artist) {
      const { data: shows } = await supabase
        .from('cached_shows')
        .select(`
          *,
          artist:artists(id, name, spotify_id)
        `)
        .eq('artist_id', artist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      return shows || [];
    }

    return [];
  }
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  
  try {
    const response = await callTicketmasterFunction('featured', undefined, {
      size: '50',
      countryCode: 'US'
    });

    // Extract events from the API response
    const events = response.data?._embedded?.events || [];
    
    // Start background import for popular tours
    if (events.length > 0) {
      supabase.functions.invoke('sync-popular-tours', {
        body: { shows: events }
      }).catch(error => {
        console.error('Background popular tours sync failed:', error);
      });
    }

    return events;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};
