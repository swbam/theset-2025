import { supabase } from '@/integrations/supabase/client';
import { callTicketmasterFunction } from './api';
import { processShow } from './client';
import type { TicketmasterEvent } from './types';

// Search specifically for artists, not just events
export const searchArtists = async (query: string) => {
  console.log('Searching for artists:', query);
  
  if (!query.trim()) {
    return [];
  }

  try {
    const results = await callTicketmasterFunction('search', query);

    // Filter for music events and extract unique artists
    const uniqueArtists = new Map();

    results.forEach((event: TicketmasterEvent) => {
      const artist = event._embedded?.attractions?.[0];
      if (artist && artist.name && artist.name.toLowerCase().includes(query.toLowerCase())) {
        if (!uniqueArtists.has(artist.name)) {
          uniqueArtists.set(artist.name, {
            name: artist.name,
            image: artist.images?.[0]?.url || event.images?.[0]?.url,
            venue: event._embedded?.venues?.[0]?.name,
            date: event.dates?.start?.dateTime,
            url: event.url,
            ticketmaster_id: artist.id,
            capacity: event._embedded?.venues?.[0]?.capacity || 0,
          });
        }
      }
    });

    return Array.from(uniqueArtists.values())
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 10); // Limit to top 10 results
  } catch (error) {
    console.error('Error searching for artists:', error);
    return [];
  }
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);

  // First check if we have the artist in our database
  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, ticketmaster_id')
    .eq('name', artistName)
    .maybeSingle();

  if (artist) {
    console.log('Found artist in database:', artist);
    
    // Check for existing shows in database
    const { data: shows } = await supabase
      .from('shows')
      .select(`
        *,
        artist:artists(*),
        venue:venues(*)
      `)
      .eq('artist_id', artist.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    if (shows && shows.length > 0) {
      console.log('Returning cached shows for artist:', artistName);
      return shows;
    }
  }

  // Fetch fresh shows from Ticketmaster
  console.log('Fetching fresh shows from Ticketmaster for artist:', artistName);
  try {
    const events = await callTicketmasterFunction('artist', artistName);
    
    // Start background import process if we have events
    if (events.length > 0) {
      console.log(`Starting background import for ${events.length} events for artist: ${artistName}`);
      
      // Trigger background sync - don't await this
      supabase.functions.invoke('sync-artist-shows', {
        body: { artistName, events }
      }).catch(error => {
        console.error('Background sync failed:', error);
      });
    }

    return events;
  } catch (error) {
    console.error('Error fetching artist events:', error);
    return [];
  }
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  
  try {
    const shows = await callTicketmasterFunction('featured', undefined, {
      size: '50',
      countryCode: 'US'
    });

    // Start background import for popular tours
    if (shows.length > 0) {
      supabase.functions.invoke('sync-popular-tours', {
        body: { shows }
      }).catch(error => {
        console.error('Background popular tours sync failed:', error);
      });
    }

    return shows;
  } catch (error) {
    console.error('Error fetching popular tours:', error);
    return [];
  }
};