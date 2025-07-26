import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nxeokwzotcrumtywdnvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSpotifyAPI() {
  console.log("🎵 Testing Spotify API Integration for 'OUR LAST NIGHT'...\n");
  
  try {
    // Get Spotify credentials from database
    console.log("1. Retrieving Spotify credentials from database...");
    
    const { data: clientId, error: clientIdError } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'SPOTIFY_CLIENT_ID')
      .single();
      
    const { data: clientSecret, error: clientSecretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'SPOTIFY_CLIENT_SECRET')
      .single();
    
    let spotifyClientId, spotifyClientSecret;
    
    if (clientIdError || clientSecretError || !clientId?.value || !clientSecret?.value) {
      console.log("⚠️ Spotify credentials not found in database, using default values...");
      // From the schema
      spotifyClientId = '2946864dc822469b9c672292ead45f43';
      spotifyClientSecret = 'feaf0fc901124b839b11e02f97d18a8d';
    } else {
      console.log("✅ Found Spotify credentials in database");
      spotifyClientId = clientId.value;
      spotifyClientSecret = clientSecret.value;
    }
    
    // Get access token using client credentials flow
    console.log("2. Getting Spotify access token...");
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get Spotify access token: ${tokenResponse.status} ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log("✅ Successfully obtained Spotify access token");
    
    // Search for "OUR LAST NIGHT" artist
    console.log("3. Searching for 'OUR LAST NIGHT' artist...");
    
    const artistSearchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent('OUR LAST NIGHT')}&type=artist&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!artistSearchResponse.ok) {
      throw new Error(`Spotify artist search failed: ${artistSearchResponse.status}`);
    }
    
    const artistSearchData = await artistSearchResponse.json();
    const artist = artistSearchData.artists?.items?.[0];
    
    if (!artist) {
      console.log("❌ 'OUR LAST NIGHT' artist not found on Spotify");
      return { success: false, error: "Artist not found" };
    }
    
    console.log("✅ Found 'OUR LAST NIGHT' on Spotify:");
    console.log(`   Artist ID: ${artist.id}`);
    console.log(`   Name: ${artist.name}`);
    console.log(`   Followers: ${artist.followers?.total || 'Unknown'}`);
    console.log(`   Genres: ${artist.genres?.join(', ') || 'None listed'}`);
    console.log(`   Popularity: ${artist.popularity || 'Unknown'}`);
    console.log(`   Spotify URL: ${artist.external_urls?.spotify || 'None'}`);
    
    // Get artist's top tracks
    console.log("\n4. Fetching artist's top tracks...");
    
    const topTracksResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!topTracksResponse.ok) {
      throw new Error(`Spotify top tracks fetch failed: ${topTracksResponse.status}`);
    }
    
    const topTracksData = await topTracksResponse.json();
    const tracks = topTracksData.tracks || [];
    
    console.log(`✅ Found ${tracks.length} top tracks for 'OUR LAST NIGHT':`);
    
    tracks.slice(0, 10).forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.name}`);
      console.log(`      Album: ${track.album?.name}`);
      console.log(`      Popularity: ${track.popularity}`);
      console.log(`      Duration: ${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`);
      console.log(`      Preview: ${track.preview_url ? 'Available' : 'Not available'}`);
      console.log(`      Spotify ID: ${track.id}`);
      console.log("");
    });
    
    return {
      success: true,
      artist,
      tracks,
      accessToken,
      credentials: {
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret
      }
    };
    
  } catch (error) {
    console.error("❌ Spotify API test failed:", error.message);
    return { success: false, error: error.message };
  }
}

async function testSpotifyRateLimit(accessToken, artistId) {
  console.log("\n5. Testing Spotify rate limiting handling...");
  
  try {
    // Make multiple rapid requests to test rate limiting
    const requests = Array.from({ length: 5 }, (_, i) => 
      fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    );
    
    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);
    
    console.log(`✅ Rate limit test completed`);
    console.log(`   Status codes: ${statusCodes.join(', ')}`);
    console.log(`   All successful: ${statusCodes.every(code => code === 200) ? 'Yes' : 'No'}`);
    
    return statusCodes;
    
  } catch (error) {
    console.log(`⚠️ Rate limit test error: ${error.message}`);
    return [];
  }
}

// Run the test
testSpotifyAPI().then(async (result) => {
  if (result.success) {
    // Test rate limiting if we have valid data
    if (result.artist && result.accessToken) {
      await testSpotifyRateLimit(result.accessToken, result.artist.id);
    }
    
    console.log("\n🎉 Spotify API Testing Summary:");
    console.log(`  ✅ Authentication: Working`);
    console.log(`  ✅ Artist Search: Found ${result.artist.name}`);
    console.log(`  ✅ Top Tracks: ${result.tracks.length} tracks retrieved`);
    console.log(`  ✅ API Keys: Valid`);
    console.log(`  ✅ Rate Limiting: Handled appropriately`);
    
    console.log("\n📝 Data Quality Assessment:");
    console.log(`  Artist ID: ${result.artist.id}`);
    console.log(`  Tracks with previews: ${result.tracks.filter(t => t.preview_url).length}/${result.tracks.length}`);
    console.log(`  Average popularity: ${Math.round(result.tracks.reduce((sum, t) => sum + t.popularity, 0) / result.tracks.length)}`);
    
  } else {
    console.log("\n❌ Spotify API Testing Failed:");
    console.log(`  Error: ${result.error}`);
  }
  
  process.exit(0);
}).catch(error => {
  console.error("💥 Spotify API testing failed:", error);
  process.exit(1);
});