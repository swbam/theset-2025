import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterEvent, TicketmasterVenue, CachedShow } from "./types";

export const callTicketmasterFunction = async (endpoint: string, query?: string, params?: Record<string, string>) => {
  console.log(`Calling Ticketmaster API - ${endpoint}:`, { query, params });
  
  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query, params },
  });

  if (error) {
    console.error('Error calling Ticketmaster function:', error);
    throw error;
  }

  return data?._embedded?.events || [];
};

export const fetchFromCache = async (artistId: string | null, ttlHours = 24) => {
  if (!artistId) return [];
  
  const { data: shows, error } = await supabase
    .from('cached_shows')
    .select(`
      *,
      venue:venues(
        id,
        name,
        city,
        state,
        country,
        address,
        capacity,
        location
      )
    `)
    .eq('artist_id', artistId)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_refresh', { 
      last_sync: shows?.[0]?.last_synced_at,
      ttl_hours: ttlHours 
    });

  return needsRefresh ? null : shows;
};

export const checkArtistCache = async (artistSpotifyId: string, ttlHours = 1) => {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('spotify_id', artistSpotifyId)
    .maybeSingle();

  if (error) {
    console.error('Error checking artist cache:', error);
    return null;
  }

  if (!artist) return null;

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_refresh', {
      last_sync: artist.last_synced_at,
      ttl_hours: ttlHours
    });

  return needsRefresh ? null : artist;
};

export const updateArtistCache = async (
  artistData: any,
  spotifyData: any,
  shows: TicketmasterEvent[]
) => {
  console.log('Updating artist cache with shows:', shows.length);
  
  // First, upsert the artist
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .upsert({
      spotify_id: spotifyData.id,
      name: spotifyData.name,
      image_url: spotifyData.images?.[0]?.url,
      genres: spotifyData.genres,
      popularity: spotifyData.popularity,
      spotify_data: spotifyData,
      last_synced_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (artistError) {
    console.error('Error updating artist cache:', artistError);
    throw artistError;
  }

  if (!artist) {
    console.error('No artist data returned after upsert');
    return null;
  }

  // Process and cache shows
  for (const show of shows) {
    const venueData = show._embedded?.venues?.[0];
    if (!venueData) {
      console.log('Skipping show, no venue data:', show.id);
      continue;
    }

    const showData = {
      ticketmaster_id: show.id,
      artist_id: artist.id,
      name: show.name,
      date: show.dates.start.dateTime,
      ticket_url: show.url,
      venue_name: venueData.name,
      venue_location: JSON.stringify(venueData),
      last_synced_at: new Date().toISOString()
    };

    console.log('Upserting show:', showData.ticketmaster_id);
    
    const { error: showError } = await supabase
      .from('cached_shows')
      .upsert(showData, {
        onConflict: 'ticketmaster_id'
      });

    if (showError) {
      console.error('Error updating show cache:', showError, showData);
    }
  }

  return artist;
};

export const updateSongsCache = async (songs: any[], artistId: string) => {
  const songsToUpsert = songs.map(song => ({
    spotify_id: song.id,
    artist_id: artistId,
    name: song.name,
    album: song.album?.name,
    preview_url: song.preview_url,
    popularity: song.popularity,
    last_synced_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('cached_songs')
    .upsert(songsToUpsert);

  if (error) {
    console.error('Error updating songs cache:', error);
    throw error;
  }

  return songsToUpsert;
};
