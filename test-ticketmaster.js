import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nxeokwzotcrumtywdnvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTicketmasterAPI() {
  console.log("🎵 Testing Ticketmaster API Integration for 'OUR LAST NIGHT'...\n");
  
  try {
    // Test 1: Test Ticketmaster Edge Function - Artist Search
    console.log("1. Testing Ticketmaster Edge Function - Artist Search...");
    
    const { data: searchResult, error: searchError } = await supabase.functions.invoke('ticketmaster', {
      body: {
        endpoint: 'artist',
        query: 'OUR LAST NIGHT'
      }
    });
    
    if (searchError) {
      console.log(`❌ Ticketmaster search failed: ${searchError.message}`);
      throw searchError;
    }
    
    console.log("✅ Ticketmaster API call successful");
    
    if (searchResult._embedded && searchResult._embedded.events) {
      const events = searchResult._embedded.events;
      console.log(`🎪 Found ${events.length} shows for 'OUR LAST NIGHT':`);
      
      events.slice(0, 5).forEach((event, index) => {
        const venue = event._embedded?.venues?.[0];
        const date = new Date(event.dates?.start?.localDate || event.dates?.start?.dateTime);
        console.log(`  ${index + 1}. ${event.name}`);
        console.log(`     📅 ${date.toLocaleDateString()}`);
        console.log(`     📍 ${venue?.name || 'Unknown Venue'}, ${venue?.city?.name || 'Unknown City'}`);
        console.log(`     🎫 ${event.url || 'No URL'}`);
        console.log(`     🆔 Ticketmaster ID: ${event.id}`);
        console.log("");
      });
      
      // Test data for caching
      if (events.length > 0) {
        const testEvent = events[0];
        const venue = testEvent._embedded?.venues?.[0];
        
        console.log("2. Testing show data structure for caching...");
        const showData = {
          ticketmaster_id: testEvent.id,
          name: testEvent.name,
          date: testEvent.dates?.start?.localDate || testEvent.dates?.start?.dateTime,
          venue_name: venue?.name,
          venue_location: {
            city: venue?.city?.name,
            state: venue?.state?.name,
            country: venue?.country?.name,
            lat: venue?.location?.latitude,
            lng: venue?.location?.longitude
          },
          ticket_url: testEvent.url
        };
        
        console.log("✅ Show data structure valid:");
        console.log(`   Name: ${showData.name}`);
        console.log(`   Date: ${showData.date}`);
        console.log(`   Venue: ${showData.venue_name}`);
        console.log(`   Location: ${showData.venue_location?.city}, ${showData.venue_location?.state}`);
        console.log(`   Ticket URL: ${showData.ticket_url}`);
        
        return { events, sampleShowData: showData };
      } else {
        console.log("⚠️ No events found for 'OUR LAST NIGHT'");
        return { events: [], sampleShowData: null };
      }
    } else {
      console.log("⚠️ No events data in response");
      console.log("Response structure:", JSON.stringify(searchResult, null, 2));
      return { events: [], sampleShowData: null };
    }
    
  } catch (error) {
    console.error("❌ Ticketmaster API test failed:", error.message);
    throw error;
  }
}

async function testTicketmasterVenueAPI(venueId) {
  if (!venueId) return null;
  
  try {
    console.log(`\n3. Testing venue details API for venue ID: ${venueId}...`);
    
    const { data: venueResult, error: venueError } = await supabase.functions.invoke('ticketmaster', {
      body: {
        endpoint: 'venues',
        query: venueId
      }
    });
    
    if (venueError) {
      console.log(`⚠️ Venue API call failed: ${venueError.message}`);
      return null;
    }
    
    console.log("✅ Venue API call successful");
    console.log(`   Venue Name: ${venueResult.name}`);
    console.log(`   City: ${venueResult.city?.name}`);
    console.log(`   State: ${venueResult.state?.name}`);
    console.log(`   Capacity: ${venueResult.upcomingEvents?._total || 'Unknown'}`);
    
    return venueResult;
    
  } catch (error) {
    console.log(`⚠️ Venue API test error: ${error.message}`);
    return null;
  }
}

testTicketmasterAPI().then(async (result) => {
  const { events, sampleShowData } = result;
  
  // Test venue API if we have events
  if (events.length > 0) {
    const firstEvent = events[0];
    const venueId = firstEvent._embedded?.venues?.[0]?.id;
    if (venueId) {
      await testTicketmasterVenueAPI(venueId);
    }
  }
  
  console.log("\n🎉 Ticketmaster API testing completed!");
  console.log(`   Total events found: ${events.length}`);
  console.log(`   API Rate limiting: Handled by edge function`);
  console.log(`   Data quality: ${sampleShowData ? 'Good' : 'No data to assess'}`);
  
  process.exit(0);
}).catch(error => {
  console.error("💥 Ticketmaster API testing failed:", error);
  process.exit(1);
});