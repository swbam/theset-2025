import { artistIdentifiers } from "../supabase/artistIdentifiers";

const SPOTIFY_API_URL = "https://api.spotify.com/v1";

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
  album: {
    name: string;
  };
  popularity: number;
  preview_url: string | null;
}

const syncArtistData = async (artist: SpotifyArtist) => {
  return await artistIdentifiers.upsertArtist({
    name: artist.name,
    metadata: {
      genres: artist.genres || [],
      popularity: artist.popularity || 0,
      image_url: artist.images?.[0]?.url,
    },
    platformData: {
      platform: 'spotify',
      platformId: artist.id,
      data: artist
    }
  });
};

export const getTopArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  const response = await fetch(`${SPOTIFY_API_URL}/me/top/artists?limit=10&time_range=short_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch top artists: ${response.statusText}`);
  }
  
  const data = await response.json();
  const artists = data.items || [];

  // Sync each artist with our database
  await Promise.all(artists.map(syncArtistData));

  return artists;
};

export const getFollowedArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
  const response = await fetch(`${SPOTIFY_API_URL}/me/following?type=artist&limit=10`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch followed artists: ${response.statusText}`);
  }
  
  const data = await response.json();
  const artists = data.artists?.items || [];

  // Sync each artist with our database
  await Promise.all(artists.map(syncArtistData));

  return artists;
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
  
  if (!response.ok) {
    throw new Error(`Failed to search artist: ${response.statusText}`);
  }
  
  const data = await response.json();
  const artist = data.artists?.items?.[0] || null;

  if (artist) {
    // Get full artist data including genres
    const artistResponse = await fetch(
      `${SPOTIFY_API_URL}/artists/${artist.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!artistResponse.ok) {
      throw new Error(`Failed to fetch artist details: ${artistResponse.statusText}`);
    }
    
    const artistData = await artistResponse.json();
    await syncArtistData(artistData);
    return artistData;
  }

  return null;
};

export const getArtistTracks = async (accessToken: string, artistId: string): Promise<SpotifyTrack[]> => {
  const response = await fetch(
    `${SPOTIFY_API_URL}/artists/${artistId}/top-tracks?market=US`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch artist tracks: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.tracks || [];
};

export const getArtistAlbumTracks = async (accessToken: string, artistId: string): Promise<SpotifyTrack[]> => {
  // First get albums
  const albumsResponse = await fetch(
    `${SPOTIFY_API_URL}/artists/${artistId}/albums?include_groups=album,single&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!albumsResponse.ok) {
    throw new Error(`Failed to fetch artist albums: ${albumsResponse.statusText}`);
  }
  
  const albumsData = await albumsResponse.json();
  const albums = albumsData.items || [];

  // Then get tracks from each album
  const trackPromises = albums.map(async (album: any) => {
    const tracksResponse = await fetch(
      `${SPOTIFY_API_URL}/albums/${album.id}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!tracksResponse.ok) {
      throw new Error(`Failed to fetch album tracks: ${tracksResponse.statusText}`);
    }
    
    const tracksData = await tracksResponse.json();
    return tracksData.items || [];
  });

  const allTracks = await Promise.all(trackPromises);
  return allTracks.flat();
};

// Helper function to get artist by either Spotify or Ticketmaster ID
export const getArtistByPlatformId = async (platform: 'spotify' | 'ticketmaster', platformId: string) => {
  return await artistIdentifiers.getArtistByPlatformId(platform, platformId);
};

// Helper function to link Spotify and Ticketmaster IDs for the same artist
export const linkArtistPlatformIds = async (
  spotifyId: string,
  ticketmasterId: string,
  spotifyData?: Record<string, any>
) => {
  // First check if we have an artist with either ID
  const spotifyArtist = await artistIdentifiers.getArtistByPlatformId('spotify', spotifyId);
  const ticketmasterArtist = await artistIdentifiers.getArtistByPlatformId('ticketmaster', ticketmasterId);

  if (spotifyArtist && ticketmasterArtist) {
    // If both exist but are different artists, we have a conflict
    if (spotifyArtist.id !== ticketmasterArtist.id) {
      console.error('Artist ID conflict:', { spotifyArtist, ticketmasterArtist });
      return false;
    }
    // If they're the same artist, we're already linked
    return true;
  }

  if (spotifyArtist) {
    // Link Ticketmaster ID to existing Spotify artist
    return await artistIdentifiers.linkPlatformId(
      spotifyArtist.id,
      'ticketmaster',
      ticketmasterId
    );
  }

  if (ticketmasterArtist) {
    // Link Spotify ID to existing Ticketmaster artist
    return await artistIdentifiers.linkPlatformId(
      ticketmasterArtist.id,
      'spotify',
      spotifyId,
      spotifyData
    );
  }

  // Neither exists yet - this shouldn't happen in normal flow
  // as one side should always exist before linking
  console.error('Attempted to link non-existent artists');
  return false;
};
