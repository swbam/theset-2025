import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const artistName = 'Eagles'; // Artist to verify

  try {
    console.log(`Fetching artist identifiers for: ${artistName}`);
    const { data, error } = await supabaseClient
      .from('artist_identifiers')
      .select('artist_id, platform, platform_id, last_synced_at')
      .eq('platform', 'spotify')
      .or('platform.eq.ticketmaster');

    if (error) {
      console.error('Error fetching artist identifiers:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`No identifiers found for artist: ${artistName}`);
    } else {
      console.log('Artist identifiers:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error verifying artist identifiers:', error);
  }
})();