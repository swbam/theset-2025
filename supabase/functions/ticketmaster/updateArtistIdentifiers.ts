import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const artistData = [
    {
      artist_id: '85926d70-5da8-496d-8f3b-f0539e7e2e',
      platform: 'spotify',
      platform_id: 'eagles',
    },
    {
      artist_id: '85926d70-5da8-496d-8f3b-f0539e7e2e',
      platform: 'ticketmaster',
      platform_id: 'K8vZ917Gku7',
    },
  ];

  try {
    console.log('Updating artist_identifiers table...');
    const { error } = await supabaseClient
      .from('artist_identifiers')
      .insert(artistData);

    if (error) {
      console.error('Error updating artist_identifiers:', error);
      return;
    }

    console.log('Artist identifiers updated successfully.');
  } catch (error) {
    console.error('Error updating artist_identifiers:', error);
  }
})();