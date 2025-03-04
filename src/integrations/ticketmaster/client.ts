
import { supabase } from "@/integrations/supabase/client";
import { PlatformClient } from "../platform/client";
import type { TicketmasterEvent, TicketmasterVenue } from './types';
import { searchArtists, fetchArtistEvents, fetchPopularTours } from './artists';
import type { Json } from '@/integrations/supabase/types';

async function processArtist(artistData: any) {
  console.log('Processing artist:', artistData.name);

  // First, check if we have an existing platform identifier
  const identifier = await PlatformClient.getIdentifier('ticketmaster', artistData.id, 'artist');
  
  if (identifier) {
    // Update the existing artist
    const { error: updateError } = await supabase
      .from('artists')
      .update({
        name: artistData.name,
        metadata: artistData as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', identifier.entity_id);

    if (updateError) {
      console.error('Error updating artist:', updateError);
      return null;
    }

    return identifier.entity_id;
  }

  // Create new artist
  const { data: artist, error: insertError } = await supabase
    .from('artists')
    .insert({
      name: artistData.name,
      metadata: artistData as unknown as Json
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating artist:', insertError);
    return null;
  }

  // Link the platform identifier
  await PlatformClient.linkIdentifier(
    'artist',
    artist.id,
    'ticketmaster',
    artistData.id,
    artistData as unknown as Record<string, any>
  );

  return artist.id;
}

async function processVenue(venueData: TicketmasterVenue) {
  console.log('Processing venue:', venueData.name);

  const identifier = await PlatformClient.getIdentifier('ticketmaster', venueData.id, 'venue');

  if (identifier) {
    const { error: updateError } = await supabase
      .from('venues')
      .update({
        name: venueData.name,
        metadata: venueData as unknown as Json
      })
      .eq('id', identifier.entity_id);

    if (updateError) {
      console.error('Error updating venue:', updateError);
      return null;
    }

    return identifier.entity_id;
  }

  const { data: venue, error: insertError } = await supabase
    .from('venues')
    .insert({
      name: venueData.name,
      ticketmaster_id: venueData.id,
      metadata: venueData as unknown as Json
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating venue:', insertError);
    return null;
  }

  await PlatformClient.linkIdentifier(
    'venue',
    venue.id,
    'ticketmaster',
    venueData.id,
    venueData as unknown as Record<string, any>
  );

  return venue.id;
}

async function processShow(showData: TicketmasterEvent, artistId: string, venueId: string) {
  console.log('Processing show:', showData.name);

  const identifier = await PlatformClient.getIdentifier('ticketmaster', showData.id, 'show');

  if (identifier) {
    const { error: updateError } = await supabase
      .from('shows')
      .update({
        artist_id: artistId,
        venue_id: venueId,
        date: showData.dates.start.dateTime,
        status: 'active',
        ticket_url: showData.url,
      })
      .eq('id', identifier.entity_id);

    if (updateError) {
      console.error('Error updating show:', updateError);
      return null;
    }

    return identifier.entity_id;
  }

  const { data: show, error: insertError } = await supabase
    .from('shows')
    .insert({
      artist_id: artistId,
      venue_id: venueId,
      date: showData.dates.start.dateTime,
      status: 'active',
      ticket_url: showData.url,
      ticketmaster_id: showData.id
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating show:', insertError);
    return null;
  }

  await PlatformClient.linkIdentifier(
    'show',
    show.id,
    'ticketmaster',
    showData.id,
    showData as unknown as Record<string, any>
  );

  return show.id;
}

export { 
  processArtist, 
  processVenue, 
  processShow,
  searchArtists,
  fetchArtistEvents,
  fetchPopularTours
};
export type { TicketmasterEvent, TicketmasterVenue };
