import { createClient } from '@supabase/supabase-js';
import { buildQueryParams } from './queryBuilder.ts';

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

export async function populateCachedShows() {
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  // Get Ticketmaster API key
  const { data: secretData, error: secretError } = await supabaseClient
    .from('secrets')
    .select('value')
    .eq('key', 'TICKETMASTER_API_KEY')
    .single();

  if (secretError || !secretData?.value) {
    console.error('Failed to retrieve Ticketmaster API key:', secretError);
    throw new Error('Ticketmaster API key not found');
  }

  const apiKey = secretData.value;

  // Build query parameters
  const params = {
    apikey: apiKey,
    size: '200',
    classificationName: 'music',
    sort: 'date,asc',
  };

  const queryParams = buildQueryParams('events', '', params);
  const apiUrl = `${BASE_URL}/events.json?${queryParams.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch events from Ticketmaster:', response.status);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data?._embedded?.events || [];

    console.log(`Fetched ${events.length} events from Ticketmaster`);

    // Insert events into cached_shows table
    const { error: insertError } = await supabaseClient
      .from('cached_shows')
      .upsert(
        events.map((event) => ({
          platform_id: event.id,
          name: event.name,
          date: event.dates?.start?.dateTime,
          venue_name: event._embedded?.venues?.[0]?.name,
          ticket_url: event.url,
          status: event.dates?.status?.code,
          last_synced_at: new Date().toISOString(),
        }))
      );

    if (insertError) {
      console.error('Failed to insert events into cached_shows:', insertError);
      throw insertError;
    }

    console.log('Successfully populated cached_shows table');
  } catch (error) {
    console.error('Error populating cached_shows:', error);
    throw error;
  }
}