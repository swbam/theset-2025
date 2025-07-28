import { supabase } from '@/integrations/supabase/client';
import { callTicketmasterFunction } from './api';
import { processShow } from './client';
import type { TicketmasterEvent } from './types';

export const searchArtists = async (query: string) => {
  console.log('Searching for artists:', query);
  const results = await callTicketmasterFunction('search', query);

  // Filter for music events and remove duplicates
  const uniqueArtists = new Map();

  results.forEach((event: TicketmasterEvent) => {
    const artist = event._embedded?.attractions?.[0];
    if (artist && artist.name) {
      if (!uniqueArtists.has(artist.name)) {
        uniqueArtists.set(artist.name, {
          name: artist.name,
          image: artist.images?.[0]?.url || event.images?.[0]?.url,
          venue: event._embedded?.venues?.[0]?.name,
          date: event.dates.start.dateTime,
          url: event.url,
          capacity: event._embedded?.venues?.[0]?.capacity || 0,
        });
      }
    }
  });

  return Array.from(uniqueArtists.values()).sort(
    (a, b) => b.capacity - a.capacity
  );
};

export const fetchArtistEvents = async (artistName: string) => {
  console.log('Fetching events for artist:', artistName);

  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('name', artistName)
    .maybeSingle();

  if (artist) {
    console.log('Found artist in database:', artist);
    const { data: shows } = await supabase
      .from('shows')
      .select(
        `
        *,
        artist:artists(*),
        venue:venues(*)
      `
      )
      .eq('artist_id', artist.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    if (shows && shows.length > 0) {
      console.log('Returning shows for artist:', artistName);
      return shows;
    }
  }

  console.log('Fetching fresh shows from Ticketmaster for artist:', artistName);
  const events = await callTicketmasterFunction('artist', artistName);

  if (artist && events.length > 0) {
    console.log('Processing Ticketmaster events for artist:', artistName);
    const processedEvents = await Promise.all(
      events.map(async (event: TicketmasterEvent) => {
        const venue = event._embedded?.venues?.[0];
        if (!venue) return null;

        return processShow(event, artist.id, venue.id);
      })
    );
    return processedEvents.filter(Boolean);
  }

  return events;
};

export const fetchPopularTours = async () => {
  console.log('Fetching popular tours');
  const shows = await callTicketmasterFunction('events', undefined, {
    classificationName: 'music',
    sort: 'relevance,desc',
    size: '100',
  });

  return shows;
};
