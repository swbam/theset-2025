
import { supabase } from "@/integrations/supabase/client";
import type { CachedShow, CachedSong } from "@/types/sync";

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
    .select('*')
    .eq('artist_id', artistId)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }

  // Check if we need to refresh the cache
  const { data: needsRefresh } = await supabase
    .rpc('needs_sync', { 
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
    .rpc('needs_sync', {
      last_sync: artist.last_synced_at,
      ttl_hours: ttlHours
    });

  return needsRefresh ? null : artist;
};

export const updateArtistCache = async (
  artistData: any,
  spotifyData: any
) => {
  // First, upsert the artist
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .upsert({
      spotify_id: spotifyData.id,
      name: spotifyData.name,
      image_url: spotifyData.images?.[0]?.url,
      genres: spotifyData.genres,
      popularity: spotifyData.popularity,
      metadata: spotifyData,
      last_synced_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (artistError) {
    console.error('Error updating artist cache:', artistError);
    throw artistError;
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

export const createInitialSetlistFromSpotifyTracks = async (showId: string, artistId: string, spotifyTracks: any[]) => {
  try {
    // Check if setlist already exists for this show
    const { data: existingSetlist, error: fetchError } = await supabase
      .from('setlists')
      .select('*')
      .eq('show_id', showId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing setlist:', fetchError);
      return null;
    }

    // If setlist already exists, don't override it
    if (existingSetlist) {
      console.log('Setlist already exists for show:', showId);
      return existingSetlist;
    }

    // Create songs from Spotify tracks (top 10)
    const songs = spotifyTracks.slice(0, 10).map((track, index) => ({
      id: `${showId}-${track.id}`,
      song_name: track.name,
      total_votes: Math.max(10 - index, 1), // Give higher votes to more popular tracks
      suggested: false,
      spotify_id: track.id,
      album: track.album?.name,
      preview_url: track.preview_url,
      popularity: track.popularity
    }));

    // Create the setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        songs: songs
      })
      .select()
      .single();

    if (setlistError) {
      console.error('Error creating setlist:', setlistError);
      return null;
    }

    // Cache the songs for faster lookup
    await updateSongsCache(spotifyTracks.slice(0, 10), artistId);

    console.log('Created initial setlist with', songs.length, 'songs for show:', showId);
    return setlist;
  } catch (error) {
    console.error('Error creating initial setlist:', error);
    return null;
  }
};
