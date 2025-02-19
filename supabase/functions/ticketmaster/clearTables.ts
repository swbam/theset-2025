import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  try {
    console.log('Clearing cached_shows table...');
    let { error } = await supabaseClient
      .from('cached_shows')
      .delete()
      .neq('id', ''); // Force delete all rows

    if (error) {
      console.error('Error clearing cached_shows:', error);
      return;
    }

    console.log('Clearing artists table...');
    ({ error } = await supabaseClient
      .from('artists')
      .delete()
      .neq('id', '')); // Force delete all rows

    if (error) {
      console.error('Error clearing artists:', error);
      return;
    }

    console.log('Tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing tables:', error);
  }
})();