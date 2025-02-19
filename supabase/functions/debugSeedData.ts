paimport { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );

  const tables = ['artists', 'artist_identifiers', 'cached_shows', 'cached_songs'];

  try {
    for (const table of tables) {
      console.log(`Querying table: ${table}`);
      const { data, error } = await supabaseClient
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error querying table ${table}:`, error);
        continue;
      }

      console.log(`Contents of table ${table}:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error querying seed data:', error);
  }
})();