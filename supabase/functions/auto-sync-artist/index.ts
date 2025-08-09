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
  // Prefer de-duplication by spotify_id if available
  if (spotifyId) {
    const { data, error } = await supabase
      .from('artists')
      .upsert(
        {
          name,
          spotify_id: spotifyId,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'spotify_id' }
      )
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }

  // Fallback when no spotify_id: try to find by name, else insert
  const { data: existing } = await supabase
    .from('artists')
    .select('id')
    .ilike('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from('artists')
    .insert({
      name,
      last_synced_at: new Date().toISOString(),
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

// Helper – create initial setlist via RPC with Spotify tracks
async function createInitialSetlist(showId: string, tracks: { id: string; name: string }[]) {
  // Only create if not exists
  const { data: existing } = await supabase
    .from('setlists')
    .select('id')
    .eq('show_id', showId)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  // Use RPC to initialize normalized setlist + setlist_songs
  const { data: newSetlistId, error: initError } = await supabase.rpc('initialize_show_setlist', {
    p_show_id: showId,
    p_spotify_tracks: tracks,
  });
  if (initError) throw new Error(initError.message);
  return newSetlistId as string;
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
    // 1. Resolve Spotify artist ID if not provided
    let resolvedSpotifyId = spotifyId;
    if (!resolvedSpotifyId) {
      try {
        const spSearch = await invokeFunction<any>('spotify', {
          action: 'search-artist',
          params: { artistName }
        });
        resolvedSpotifyId = spSearch?.data?.id ?? null;
      } catch (_) {
        resolvedSpotifyId = null;
      }
    }

    // Upsert artist row
    const artistId = await upsertArtist(artistName, resolvedSpotifyId ?? undefined);

    // 2. Import shows via Ticketmaster edge function
    // Call Ticketmaster proxy for artist events
    let tmResponse: any = null;
    try {
      tmResponse = await invokeFunction<any>('ticketmaster', {
        endpoint: 'artist-events',
        query: artistName,
      });
    } catch (_) {
      tmResponse = null;
    }

    const events: any[] = tmResponse?.data?._embedded?.events ?? [];

    for (const ev of events) {
      const venue = ev._embedded?.venues?.[0];
      let venueId = null;

      // Upsert venue first if exists
      if (venue) {
        const { data: venueData } = await supabase
          .from('venues')
          .upsert({
            ticketmaster_id: venue.id,
            name: venue.name,
            city: venue.city?.name ?? null,
            state: venue.state?.name ?? null,
            country: venue.country?.name ?? null,
            timezone: venue.timezone ?? null,
            address: venue.address?.line1 ?? null,
            postal_code: venue.postalCode ?? null,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'ticketmaster_id' })
          .select('id')
          .single();
        
        venueId = venueData?.id ?? null;
      }

      await supabase
        .from('shows')
        .upsert({
          ticketmaster_id: ev.id,
          artist_id: artistId,
          venue_id: venueId,
          name: ev.name,
          date: ev.dates?.start?.dateTime ?? null,
        }, { onConflict: 'ticketmaster_id' });

      // Also upsert cached_shows used by the frontend
      await supabase
        .from('cached_shows')
        .upsert({
          ticketmaster_id: ev.id,
          artist_id: artistId,
          name: ev.name,
          date: ev.dates?.start?.dateTime ?? null,
          venue_name: venue?.name ?? null,
          venue_location: venue ? {
            city: venue.city?.name,
            state: venue.state?.name,
            country: venue.country?.name
          } : null,
          ticket_url: ev.url ?? null,
          last_synced_at: new Date().toISOString()
        }, { onConflict: 'ticketmaster_id' });
    }

    // 3. Cache ALL Spotify tracks for this artist (albums, singles, etc.)
    type Track = { id: string; name: string };
    let tracks: Track[] = [];
    try {
      if (resolvedSpotifyId) {
        const spAll = await invokeFunction<any>('spotify', {
          action: 'artistAllTracks',
          params: { artistId: resolvedSpotifyId },
        });
        tracks = spAll?.data?.map((t: any) => ({ id: t.id, name: t.name })) ?? [];
      }
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
            album: 'Unknown Album',
            popularity: 50,
            last_synced_at: new Date().toISOString()
          })),
          { onConflict: 'artist_id,spotify_id' }
        );
      }

      // Update artist sync timestamp
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artistId);
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
