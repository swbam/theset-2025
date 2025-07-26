
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

// Rate limiting and retry logic
const RATE_LIMIT_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeSpotifyRequest = async (url: string, accessToken: string, retries = 0): Promise<Response> => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Handle rate limiting (429 status)
  if (response.status === 429 && retries < MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_DELAY * Math.pow(2, retries);
    console.log(`Rate limited, retrying in ${delay}ms...`);
    await sleep(delay);
    return makeSpotifyRequest(url, accessToken, retries + 1);
  }

  // Handle token expiration (401 status)
  if (response.status === 401) {
    throw new Error('Spotify access token expired or invalid');
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response;
};

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export const getTopArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  try {
    const response = await makeSpotifyRequest(
      `${SPOTIFY_API_URL}/me/top/artists?limit=10&time_range=short_term`,
      accessToken
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
};

export const getFollowedArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  try {
    const response = await makeSpotifyRequest(
      `${SPOTIFY_API_URL}/me/following?type=artist&limit=10`,
      accessToken
    );
    const data = await response.json();
    return data.artists?.items || [];
  } catch (error) {
    console.error('Error fetching followed artists:', error);
    throw error;
  }
};

export const searchArtist = async (accessToken: string, artistName: string): Promise<SpotifyArtist | null> => {
  try {
    const response = await makeSpotifyRequest(
      `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      accessToken
    );
    const data = await response.json();
    return data.artists?.items?.[0] || null;
  } catch (error) {
    console.error('Error searching artist:', error);
    throw error;
  }
};

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images?: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  preview_url: string | null;
  popularity: number;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export const getArtistTopTracks = async (accessToken: string, artistId: string, market: string = 'US'): Promise<SpotifyTrack[]> => {
  try {
    const response = await makeSpotifyRequest(
      `${SPOTIFY_API_URL}/artists/${artistId}/top-tracks?market=${market}`,
      accessToken
    );
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Error fetching artist top tracks:', error);
    throw error;
  }
};

export const getArtistById = async (accessToken: string, artistId: string): Promise<SpotifyArtist | null> => {
  try {
    const response = await makeSpotifyRequest(
      `${SPOTIFY_API_URL}/artists/${artistId}`,
      accessToken
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching artist by ID:', error);
    throw error;
  }
};

