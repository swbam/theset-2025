// Supabase Edge Function – Auto-sync artist data (Ticketmaster shows + Spotify songs)
// This is a pragmatic MVP implementation – it imports the artist row, any upcoming
// Ticketmaster events, caches the artist's top Spotify tracks, and builds an
// initial setlist for each newly-imported show.

// The function expects a POST body:
//   {
//     "artistName": "Coldplay",
//     "spotifyId": "4gzpq5DPGxSnKTe4SA8HAU" // optional – speeds up lookup
//   }
// It is idempotent – running it twice will not create duplicate DB rows.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface RequestBody {
  artistName?: string;
  spotifyId?: string;
}

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  SERVICE_ROLE_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  }
);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Helper – upsert artist row and return its DB id
async function upsertArtist(name: string, spotifyId?: string) {
  const { data, error } = await supabase
    .from('artists')
    .upsert({
      name,
      spotify_id: spotifyId ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

// Helper – call other edge functions internally
async function invokeFunction<T>(fn: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, {
    body: payload,
  });
  if (error) throw new Error(error.message);
  return data as T;
}

// Helper – build initial setlist from top Spotify tracks
async function createInitialSetlist(showId: string, tracks: { id: string; name: string }[]) {
  // Only insert if a setlist doesn't already exist
  const { data: existing } = await supabase.from('setlists').select('id').eq('show_id', showId).maybeSingle();
  if (existing?.id) return existing.id as string;

  // Pick 5 random distinct songs from the artist catalogue
  const pickCount = Math.min(5, tracks.length);
  const shuffled = [...tracks].sort(() => 0.5 - Math.random());
  const initial = shuffled.slice(0, pickCount).map((t) => ({
    id: crypto.randomUUID(),
    spotify_id: t.id,
    name: t.name,
    suggested: false,
  }));

  const { data, error } = await supabase
    .from('setlists')
    .insert({ show_id: showId, songs: initial })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { artistName, spotifyId } = body;
  if (!artistName) return jsonResponse({ error: 'artistName is required' }, 400);

  try {
    // 1. Upsert artist row
    const artistId = await upsertArtist(artistName, spotifyId);

    // 2. Import shows via Ticketmaster edge function
    type TMResponse = { events: { id: string; name: string; dates: { start: { dateTime: string } } }[] };

    let tmData: TMResponse;
    try {
      tmData = await invokeFunction<TMResponse>('ticketmaster', {
        endpoint: 'artist-events',
        artistName,
      });
    } catch (e) {
      // Non-fatal – continue without events
      tmData = { events: [] } as TMResponse;
    }

    for (const ev of tmData.events ?? []) {
      await supabase
        .from('shows')
        .upsert({
          ticketmaster_id: ev.id,
          artist_id: artistId,
          name: ev.name,
          starts_at: ev.dates?.start?.dateTime ?? null,
        });
    }

    // 3. Cache ALL Spotify tracks for this artist (albums, singles, etc.)
    type Track = { id: string; name: string };
    let tracks: Track[] = [];
    try {
      tracks = await invokeFunction<{ tracks: Track[] }>('spotify', {
        action: 'artist-all-tracks',
        params: { artistId: spotifyId, artistName },
      }).then((d: any) => d.tracks ?? []);
    } catch (_) {
      // ignore – proceed even if catalogue fetch fails
    }

    if (tracks.length) {
      // Bulk upsert into cached_songs table
      const chunks = [];
      for (let i = 0; i < tracks.length; i += 1000) {
        chunks.push(tracks.slice(i, i + 1000));
      }
      for (const chunk of chunks) {
        await supabase.from('cached_songs').upsert(
          chunk.map((t) => ({
            artist_id: artistId,
            spotify_id: t.id,
            name: t.name,
          })),
          { onConflict: 'spotify_id' }
        );
      }
    }

    // 4. Create setlists for new shows
    const { data: shows } = await supabase.from('shows').select('id').eq('artist_id', artistId);
    for (const show of shows ?? []) {
      await createInitialSetlist(show.id as string, tracks);
    }

    return jsonResponse({ success: true, artistId });
  } catch (error) {
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
});
