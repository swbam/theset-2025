import { supabase } from '@/integrations/supabase/client';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres?: string[];
  popularity?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images?: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  popularity: number;
  preview_url?: string;
}

// Call the Spotify Edge Function for server-side API calls
const callSpotifyFunction = async (
  action: string,
  params: Record<string, any>
) => {
  console.log(`Calling Spotify Edge Function - ${action}:`, params);

  const { data, error } = await supabase.functions.invoke('spotify', {
    body: { action, params },
  });

  if (error) {
    console.error('Error calling Spotify function:', error);
    throw error;
  }

  return data?.data;
};

// User-specific functions (use direct API with user's token)
export const getTopArtists = async (
  accessToken: string
): Promise<SpotifyArtist[]> => {
  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/me/top/artists?limit=10&time_range=short_term`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error getting top artists:', error);
    return [];
  }
};

export const getFollowedArtists = async (
  accessToken: string
): Promise<SpotifyArtist[]> => {
  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/me/following?type=artist&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.artists?.items || [];
  } catch (error) {
    console.error('Error getting followed artists:', error);
    return [];
  }
};

// Server-side functions (use Edge Function to avoid CORS)
export const searchArtist = async (
  artistName: string
): Promise<SpotifyArtist | null> => {
  try {
    return await callSpotifyFunction('searchArtist', { artistName });
  } catch (error) {
    console.error('Error searching artist:', error);
    return null;
  }
};

export const getArtistTopTracks = async (
  artistId: string
): Promise<SpotifyTrack[]> => {
  try {
    return await callSpotifyFunction('getArtistTopTracks', { artistId });
  } catch (error) {
    console.error('Error getting artist top tracks:', error);
    return [];
  }
};

export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    return await callSpotifyFunction('searchTracks', { query });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
};