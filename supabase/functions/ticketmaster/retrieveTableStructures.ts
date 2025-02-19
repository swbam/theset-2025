import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const tables = ['artist_identifiers', 'artists', 'cached_shows', 'cached_songs'];

  try {
    for (const table of tables) {
      console.log(`Retrieving structure for table: ${table}`);
      const { data, error } = await supabaseClient
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', table);

      if (error) {
        console.error(`Error retrieving structure for table ${table}:`, error);
        continue;
      }

      console.log(`Structure for table ${table}:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error retrieving table structures:', error);
  }
})();