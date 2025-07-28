import { supabase } from '@/integrations/supabase/client';

export const callSpotifyFunction = async (
  action: string,
  query?: string,
  artistId?: string
) => {
  console.log(`Calling Spotify API - ${action}:`, { query, artistId });

  const { data, error } = await supabase.functions.invoke('spotify', {
    body: { action, query, artistId },
  });

  if (error) {
    console.error('Error calling Spotify function:', error);
    throw error;
  }

  return data;
};

export const searchSpotifyArtist = async (artistName: string) => {
  const data = await callSpotifyFunction('search-artist', artistName);
  return data.artists?.items?.[0] || null;
};

export const getArtistTopTracks = async (
  artistName: string,
  spotifyId?: string
) => {
  const data = await callSpotifyFunction(
    'artist-top-tracks',
    artistName,
    spotifyId
  );
  return data.tracks || [];
};

export const syncArtistSongs = async (artistId: string, artistName: string) => {
  try {
    console.log('Syncing songs for artist:', artistName);

    // Get artist's top tracks from Spotify
    const tracks = await getArtistTopTracks(artistName);

    if (!tracks || tracks.length === 0) {
      console.log('No tracks found for artist:', artistName);
      return [];
    }

    // Prepare songs for caching
    const songsToCache = tracks.slice(0, 10).map((track: SpotifyTrack) => ({
      spotify_id: track.id,
      artist_id: artistId,
      name: track.name,
      album: track.album?.name,
      preview_url: track.preview_url,
      popularity: track.popularity,
      last_synced_at: new Date().toISOString(),
    }));

    // Cache songs in database
    const { data, error } = await supabase
      .from('cached_songs')
      .upsert(songsToCache, {
        onConflict: 'spotify_id,artist_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error caching songs:', error);
      throw error;
    }

    console.log(`Successfully cached ${data.length} songs for ${artistName}`);
    return data;
  } catch (error) {
    console.error('Error syncing artist songs:', error);
    throw error;
  }
};

export const updateArtistWithSpotifyData = async (
  artistId: string,
  artistName: string
) => {
  try {
    console.log('Updating artist with Spotify data:', artistName);

    // Search for artist on Spotify
    const spotifyArtist = await searchSpotifyArtist(artistName);

    if (!spotifyArtist) {
      console.log('Artist not found on Spotify:', artistName);
      return null;
    }

    // Update artist record with Spotify data
    const { data: updatedArtist, error } = await supabase
      .from('artists')
      .update({
        spotify_id: spotifyArtist.id,
        image_url: spotifyArtist.images?.[0]?.url,
        genres: spotifyArtist.genres,
        metadata: spotifyArtist,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', artistId)
      .select()
      .single();

    if (error) {
      console.error('Error updating artist:', error);
      throw error;
    }

    // Sync the artist's songs
    await syncArtistSongs(artistId, artistName);

    return updatedArtist;
  } catch (error) {
    console.error('Error updating artist with Spotify data:', error);
    throw error;
  }
};
