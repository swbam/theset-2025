
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
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

export const getTopArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  const response = await fetch(`${SPOTIFY_API_URL}/me/top/artists?limit=10&time_range=short_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data.items || [];
};

export const getFollowedArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  const response = await fetch(`${SPOTIFY_API_URL}/me/following?type=artist&limit=10`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data.artists?.items || [];
};

export const searchArtist = async (accessToken: string, artistName: string): Promise<SpotifyArtist | null> => {
  const response = await fetch(
    `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.artists?.items?.[0] || null;
};

export const getArtistTopTracks = async (accessToken: string, artistId: string): Promise<SpotifyTrack[]> => {
  const response = await fetch(
    `${SPOTIFY_API_URL}/artists/${artistId}/top-tracks?market=US`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.tracks || [];
};

