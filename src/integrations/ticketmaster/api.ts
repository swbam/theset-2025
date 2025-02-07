
import { supabase } from "@/integrations/supabase/client";
import type { TicketmasterEvent, CachedShow, CachedVenue } from "./types";

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

  // Process and cache shows
  const showsToUpsert = shows.map(show => ({
    ticketmaster_id: show.id,
    artist_id: artist?.id,
    name: show.name,
    date: show.dates.start.dateTime,
    ticket_url: show.url,
    venue_name: show._embedded?.venues?.[0]?.name,
    venue_location: show._embedded?.venues?.[0],
    last_synced_at: new Date().toISOString()
  }));

  const { error: showsError } = await supabase
    .from('cached_shows')
    .upsert(showsToUpsert);

  if (showsError) {
    console.error('Error updating shows cache:', showsError);
    throw showsError;
  }

  // Process and cache venues
  const venues = shows
    .map(show => show._embedded?.venues?.[0])
    .filter(venue => venue) as TicketmasterVenue[];

  const venuesToUpsert = venues.map(venue => ({
    ticketmaster_id: venue.id,
    name: venue.name,
    city: venue.city?.name,
    state: venue.state?.name,
    country: venue.country?.name,
    address: venue.address?.line1,
    capacity: venue.capacity,
    last_synced_at: new Date().toISOString()
  }));

  const { error: venuesError } = await supabase
    .from('venues')
    .upsert(venuesToUpsert);

  if (venuesError) {
    console.error('Error updating venues cache:', venuesError);
    throw venuesError;
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

