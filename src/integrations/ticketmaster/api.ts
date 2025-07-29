import { supabase } from '@/integrations/supabase/client';
import type { CachedShow, CachedSong } from '@/types/sync';
import type { SpotifyTrack, SpotifyArtist } from '@/integrations/spotify/client';
import type { TicketmasterArtist } from './types';
import type { Json } from '@/integrations/supabase/types';

export const callTicketmasterFunction = async (
  endpoint: string,
  query?: string,
  params?: Record<string, string>
) => {
  console.log(`Calling Ticketmaster API - ${endpoint}:`, { query, params });

  const { data, error } = await supabase.functions.invoke('ticketmaster', {
    body: { endpoint, query, params },
  });

  if (error) {
    console.error('Error calling Ticketmaster function:', error);
    throw error;
  }

  return data;
};

export const createInitialSetlistFromSpotifyTracks = async (
  showId: string,
  spotifyTracks: SpotifyTrack[]
): Promise<string> => {
  // Create songs array from Spotify tracks
  const songs = spotifyTracks.map((track, index) => ({
    id: `song-${track.id}`,
    name: track.name,
    song_name: track.name,
    spotify_id: track.id,
    total_votes: 0,
    suggested: false,
    order: index,
  }));

  // Create new setlist with real Spotify data
  const { data: setlist, error } = await supabase
    .from('setlists')
    .insert({
      show_id: showId,
      songs: songs,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating setlist:', error);
    throw error;
  }

  return setlist.id;
};

export const fetchFromCache = async (
  artistId: string | null,
  ttlHours = 24
) => {
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
  const { data: needsRefresh } = await supabase.rpc('needs_sync', {
    last_sync: shows?.[0]?.last_synced_at,
    ttl_hours: ttlHours,
  });

  return needsRefresh ? null : shows;
};

export const checkArtistCache = async (
  artistSpotifyId: string,
  ttlHours = 1
) => {
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
  const { data: needsRefresh } = await supabase.rpc('needs_sync', {
    last_sync: artist.last_synced_at,
    ttl_hours: ttlHours,
  });

  return needsRefresh ? null : artist;
};

export const updateArtistCache = async (artistData: TicketmasterArtist, spotifyData: SpotifyArtist) => {
  // First, upsert the artist
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .upsert({
      spotify_id: spotifyData.id,
      name: spotifyData.name,
      image_url: spotifyData.images?.[0]?.url,
      genres: spotifyData.genres,
      popularity: spotifyData.popularity,
      metadata: spotifyData as unknown as Json,
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (artistError) {
    console.error('Error updating artist cache:', artistError);
    throw artistError;
  }

  return artist;
};

export const updateSongsCache = async (songs: SpotifyTrack[], artistId: string) => {
  const songsToUpsert = songs.map((song) => ({
    spotify_id: song.id,
    artist_id: artistId,
    name: song.name,
    album: song.album?.name,
    preview_url: song.preview_url,
    popularity: song.popularity,
    last_synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('cached_songs').upsert(songsToUpsert);

  if (error) {
    console.error('Error updating songs cache:', error);
    throw error;
  }

  return songsToUpsert;
};
