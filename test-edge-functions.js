import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nxeokwzotcrumtywdnvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEdgeFunctions() {
  console.log("🔧 Testing Edge Functions Deployment Status...\n");
  
  const functions = ['ticketmaster', 'sync-artist-songs', 'sync-popular-tours'];
  
  for (const functionName of functions) {
    try {
      console.log(`Testing ${functionName} function...`);
      
      // Try a simple ping test
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });
      
      if (error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          console.log(`❌ ${functionName}: Not deployed (404)`);
        } else {
          console.log(`⚠️ ${functionName}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${functionName}: Available`);
      }
      
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.log(`❌ ${functionName}: Not deployed (404)`);
      } else {
        console.log(`⚠️ ${functionName}: ${error.message}`);
      }
    }
  }
  
  console.log("\n📝 Edge Functions Status Summary Complete");
}

async function testDirectTicketmasterAPI() {
  console.log("\n🎵 Testing Direct Ticketmaster API (bypassing edge function)...\n");
  
  try {
    // Get API key from database
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'TICKETMASTER_API_KEY')
      .single();
    
    if (secretError || !secretData?.value) {
      console.log("⚠️ Ticketmaster API key not found in secrets table");
      console.log("Trying with environment API key...");
      
      // Try with the API key from the schema
      const apiKey = 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b';
      
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=OUR LAST NIGHT&classificationName=music&sort=date,asc&size=10`;
      
      console.log("Making direct API call to Ticketmaster...");
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data._embedded && data._embedded.events) {
        const events = data._embedded.events;
        console.log(`✅ Direct API call successful! Found ${events.length} shows for 'OUR LAST NIGHT':`);
        
        events.slice(0, 3).forEach((event, index) => {
          const venue = event._embedded?.venues?.[0];
          const date = new Date(event.dates?.start?.localDate || event.dates?.start?.dateTime);
          console.log(`  ${index + 1}. ${event.name}`);
          console.log(`     📅 ${date.toLocaleDateString()}`);
          console.log(`     📍 ${venue?.name || 'Unknown Venue'}, ${venue?.city?.name || 'Unknown City'}`);
          console.log(`     🎫 ${event.url || 'No URL'}`);
          console.log("");
        });
        
        return { success: true, events, apiKey };
      } else {
        console.log("⚠️ No events found in API response");
        return { success: true, events: [], apiKey };
      }
      
    } else {
      console.log("✅ Found API key in secrets table, making direct call...");
      
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${secretData.value}&keyword=OUR LAST NIGHT&classificationName=music&sort=date,asc&size=10`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data._embedded && data._embedded.events) {
        const events = data._embedded.events;
        console.log(`✅ Direct API call successful! Found ${events.length} shows for 'OUR LAST NIGHT':`);
        
        events.slice(0, 3).forEach((event, index) => {
          const venue = event._embedded?.venues?.[0];
          const date = new Date(event.dates?.start?.localDate || event.dates?.start?.dateTime);
          console.log(`  ${index + 1}. ${event.name}`);
          console.log(`     📅 ${date.toLocaleDateString()}`);
          console.log(`     📍 ${venue?.name || 'Unknown Venue'}, ${venue?.city?.name || 'Unknown City'}`);
          console.log(`     🎫 ${event.url || 'No URL'}`);
          console.log("");
        });
        
        return { success: true, events, apiKey: secretData.value };
      } else {
        console.log("⚠️ No events found in API response");
        return { success: true, events: [], apiKey: secretData.value };
      }
    }
    
  } catch (error) {
    console.error("❌ Direct Ticketmaster API test failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Run the tests
testEdgeFunctions().then(async () => {
  const ticketmasterResult = await testDirectTicketmasterAPI();
  
  console.log("\n🎉 API Testing Summary:");
  console.log(`  Ticketmaster Direct API: ${ticketmasterResult.success ? '✅ Working' : '❌ Failed'}`);
  
  if (ticketmasterResult.success && ticketmasterResult.events) {
    console.log(`  Events found: ${ticketmasterResult.events.length}`);
    console.log(`  API Key valid: ${ticketmasterResult.apiKey ? '✅ Yes' : '❌ No'}`);
  }
  
  process.exit(0);
}).catch(error => {
  console.error("💥 Testing failed:", error);
  process.exit(1);
});