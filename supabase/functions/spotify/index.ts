// Supabase Edge Function – Spotify proxy
// This Deno script is executed by Supabase Edge Runtime.
// It wraps a handful of Spotify Web-API endpoints so the front-end can
// call them safely (no client secret exposure, no CORS issues).

// NOTE:  In the local CI environment this code is *not* executed, but having
// the correct implementation in the repository unblocks real deployments and
// prevents 404s when the front-end invokes `supabase.functions.invoke('spotify')`.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface RequestPayload {
  action: string;
  params?: Record<string, unknown>;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID") ??
  "2946864dc822469b9c672292ead45f43";
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET") ??
  "feaf0fc901124b839b11e02f97d18a8d";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const credentials = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(credentials)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) {
    console.error("Failed to fetch Spotify token", await resp.text());
    throw new Error("spotify_auth_failed");
  }

  const data = (await resp.json()) as SpotifyTokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

async function searchArtist(artistName: string) {
  const token = await getAccessToken();
  const q = encodeURIComponent(artistName);
  const url = `${SPOTIFY_API_BASE}/search?type=artist&limit=1&q=${q}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.artists?.items?.[0] ?? null;
}

async function getArtistTopTracks(artistId: string) {
  const token = await getAccessToken();
  const url = `${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=US`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.tracks ?? [];
}

async function searchTracks(query: string) {
  const token = await getAccessToken();
  const q = encodeURIComponent(query);
  const url = `${SPOTIFY_API_BASE}/search?type=track&limit=10&q=${q}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.tracks?.items ?? [];
}

// Fetch the full track catalogue for an artist (all albums/singles)
async function getArtistAllTracks(artistId: string): Promise<any[]> {
  const token = await getAccessToken();

  // 1. fetch albums (limit 50 per page)
  const albums: any[] = [];
  let url = `${SPOTIFY_API_BASE}/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&limit=50`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    albums.push(...(json.items || []));
    url = json.next ?? null;
  }

  // Deduplicate album IDs
  const albumIds = [...new Set(albums.map((a) => a.id))];

  // 2. Fetch tracks per album in batches of 20 ids (API limit)
  const tracks: any[] = [];
  for (let i = 0; i < albumIds.length; i += 20) {
    const batch = albumIds.slice(i, i + 20);
    const albumRes = await fetch(`${SPOTIFY_API_BASE}/albums?ids=${batch.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const albumJson = await albumRes.json();
    for (const album of albumJson.albums ?? []) {
      tracks.push(...(album.tracks?.items ?? []));
    }
  }

  // Filter out live recordings and deduplicate by track name (case insensitive)
  const unique = new Map<string, { id: string; name: string }>();
  tracks.forEach((t: any) => {
    const trackName = t.name?.toLowerCase() || '';
    
    // Skip tracks with "live" in the title (various formats)
    if (
      trackName.includes('live') ||
      trackName.includes('(live') ||
      trackName.includes('[live') ||
      trackName.includes('- live') ||
      trackName.includes('acoustic') ||
      trackName.includes('unplugged') ||
      trackName.includes('concert') ||
      trackName.includes('session')
    ) {
      return; // Skip this track
    }

    // Use normalized track name for deduplication (removes common suffixes)
    const normalizedName = trackName
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses content
      .replace(/\s*\[.*?\]\s*/g, '') // Remove bracket content
      .replace(/\s*-\s*(remaster|remix|edit|version|deluxe).*$/i, '') // Remove version suffixes
      .trim();

    // Only keep if we haven't seen this normalized name before
    if (!unique.has(normalizedName) && t.id && t.name) {
      unique.set(normalizedName, { id: t.id, name: t.name });
    }
  });

  return [...unique.values()];
}

function error(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return error(405, "Method Not Allowed");
  }

  let payload: RequestPayload | null = null;
  try {
    payload = (await req.json()) as RequestPayload;
  } catch {
    return error(400, "Invalid JSON body");
  }

  const { action, params = {} } = payload ?? {};

  try {
    switch (action) {
      // New camelCase actions
      case "searchArtist":
      // Legacy kebab-case from existing front-end helpers
      case "search-artist": {
        const { artistName } = params as { artistName: string };
        if (!artistName) return error(400, "artistName required");
        const data = await searchArtist(artistName);
        return Response.json({ data });
      }
      case "getArtistTopTracks":
      case "artist-top-tracks": {
        const { artistId } = params as { artistId: string };
        if (!artistId) return error(400, "artistId required");
        const data = await getArtistTopTracks(artistId);
        return Response.json({ data });
      }
      case "searchTracks":
      case "search-tracks": {
        const { query } = params as { query: string };
        if (!query) return error(400, "query required");
        const data = await searchTracks(query);
        return Response.json({ data });
      }
      case "artist-all-tracks":
      case "artistAllTracks": {
        const { artistId } = params as { artistId: string };
        if (!artistId) return error(400, "artistId required");
        const data = await getArtistAllTracks(artistId);
        return Response.json({ data });
      }
      default:
        return error(400, "Unknown action");
    }
  } catch (err) {
    console.error("Spotify function error", err);
    return error(500, "Internal Server Error");
  }
});
