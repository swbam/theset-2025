import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

(async () => {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  const eventId = '1a9Zk7Y34xAZe56'; // Specific eventId to verify

  try {
    console.log(`Fetching data for eventId: ${eventId} from cached_shows...`);
    const { data, error } = await supabaseClient
      .from('cached_shows')
      .select('*')
      .eq('ticketmaster_id', eventId)
      .single();

    if (error) {
      console.error('Error fetching data from cached_shows:', error);
      return;
    }

    if (!data) {
      console.log(`No data found for eventId: ${eventId}`);
    } else {
      console.log('Data for eventId:', data);
    }
  } catch (error) {
    console.error('Error verifying cached_shows:', error);
  }
})();