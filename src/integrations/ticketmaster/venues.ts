import { supabase } from '@/integrations/supabase/client';
import { PlatformClient } from '../platform/client';
import type { CachedVenue, TicketmasterVenue } from './types';
import type { Json, Tables } from '@/integrations/supabase/types';

interface VenueMetadata {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates: null;
}

// Convert database venue row to CachedVenue type
function mapDatabaseVenueToCachedVenue(dbVenue: Tables<'venues'>): CachedVenue {
  return {
    id: dbVenue.id,
    ticketmaster_id: dbVenue.ticketmaster_id,
    name: dbVenue.name,
    metadata: dbVenue.metadata as Record<string, any>,
    created_at: dbVenue.created_at,
  };
}

export async function cacheVenueData(
  venue: TicketmasterVenue
): Promise<CachedVenue | null> {
  try {
    const venueObj: VenueMetadata = {
      name: venue.name,
      address: venue.address?.line1,
      city: venue.city?.name,
      state: venue.state?.name || venue.city?.state?.name,
      country: venue.country?.name,
      coordinates: null,
    };

    const { data, error } = await supabase
      .from('venues')
      .upsert({
        ticketmaster_id: venue.id,
        name: venue.name,
        metadata: venueObj as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error('Error caching venue:', error);
      return null;
    }

    return {
      ...data,
      metadata: venueObj,
    };
  } catch (error) {
    console.error('Error caching venue:', error);
    return null;
  }
}

export async function getVenueById(
  ticketmasterId: string
): Promise<CachedVenue | null> {
  console.log('Getting venue by Ticketmaster ID:', ticketmasterId);

  try {
    // First, check the local cache
    const { data: cachedVenue, error: cacheError } = await supabase
      .from('venues')
      .select('*')
      .eq('ticketmaster_id', ticketmasterId)
      .single();

    if (cacheError) {
      console.log('Venue not found in cache, or error occurred:', cacheError);
      // Fetch from Ticketmaster API via our serverless function
      const venueData = await fetchVenueData(ticketmasterId);

      if (!venueData) {
        console.error('Failed to fetch venue data from Ticketmaster');
        return null;
      }

      // Cache the venue data
      return await cacheVenueData(venueData);
    }

    const needsRefresh = await PlatformClient.needsSync(
      cachedVenue.created_at as string
    );

    if (needsRefresh) {
      console.log('Venue cache is stale, refreshing...');
      const venueData = await fetchVenueData(ticketmasterId);

      if (!venueData) {
        console.error(
          'Failed to fetch venue data from Ticketmaster for refresh'
        );
        return mapDatabaseVenueToCachedVenue(cachedVenue);
      }

      return await cacheVenueData(venueData);
    }

    return mapDatabaseVenueToCachedVenue(cachedVenue);
  } catch (error) {
    console.error('Error in getVenueById:', error);
    return null;
  }
}

async function fetchVenueData(
  venueId: string
): Promise<TicketmasterVenue | null> {
  console.log('Fetching venue data from Ticketmaster:', venueId);

  try {
    const { data, error } = await supabase.functions.invoke('ticketmaster', {
      body: {
        endpoint: 'venues',
        venueId,
      },
    });

    if (error) {
      console.error('Error calling Ticketmaster function for venue:', error);
      return null;
    }

    return data as TicketmasterVenue;
  } catch (error) {
    console.error('Error fetching venue data:', error);
    return null;
  }
}
