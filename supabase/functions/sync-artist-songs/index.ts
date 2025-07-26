import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting artist songs sync job...');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get Spotify client credentials
    const { data: spotifyClientId, error: clientIdError } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'SPOTIFY_CLIENT_ID')
      .single();

    const { data: spotifyClientSecret, error: clientSecretError } = await supabaseClient
      .from('secrets')
      .select('value')
      .eq('key', 'SPOTIFY_CLIENT_SECRET')
      .single();

    if (clientIdError || clientSecretError || !spotifyClientId?.value || !spotifyClientSecret?.value) {
      throw new Error('Spotify credentials not found in secrets table');
    }

    // Get access token using client credentials flow
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${spotifyClientId.value}:${spotifyClientSecret.value}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get artists that need song sync (have spotify_id but no cached songs or old cache)
    const { data: artists, error: artistsError } = await supabaseClient
      .from('artists')
      .select('id, name, spotify_id, last_synced_at')
      .not('spotify_id', 'is', null)
      .or('last_synced_at.is.null,last_synced_at.lt.' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (artistsError) {
      throw artistsError;
    }

    console.log(`Found ${artists.length} artists needing song sync...`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each artist
    for (const artist of artists) {
      try {
        console.log(`Syncing songs for artist: ${artist.name}`);

        // Get artist's top tracks from Spotify
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.spotify_id}/top-tracks?market=US`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!tracksResponse.ok) {
          console.error(`Failed to fetch tracks for ${artist.name}:`, tracksResponse.status);
          errorCount++;
          continue;
        }

        const tracksData = await tracksResponse.json();
        const tracks = tracksData.tracks || [];

        if (tracks.length === 0) {
          console.log(`No tracks found for artist: ${artist.name}`);
          continue;
        }

        // Prepare songs for upserting
        const songsToUpsert = tracks.map((track: any) => ({
          spotify_id: track.id,
          artist_id: artist.id,
          name: track.name,
          album: track.album?.name,
          preview_url: track.preview_url,
          popularity: track.popularity,
          last_synced_at: new Date().toISOString()
        }));

        // Upsert songs
        const { error: songsError } = await supabaseClient
          .from('cached_songs')
          .upsert(songsToUpsert);

        if (songsError) {
          console.error(`Error caching songs for ${artist.name}:`, songsError);
          errorCount++;
          continue;
        }

        // Update artist's last_synced_at
        const { error: updateError } = await supabaseClient
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);

        if (updateError) {
          console.error(`Error updating artist sync timestamp:`, updateError);
        }

        console.log(`Successfully synced ${tracks.length} songs for ${artist.name}`);
        processedCount++;

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing artist ${artist.name}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Artist songs sync completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      totalArtists: artists.length,
      processedCount,
      errorCount,
      timestamp: new Date().toISOString()
    };

    console.log('Artist songs sync completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-artist-songs function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});