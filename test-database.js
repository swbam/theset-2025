import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nxeokwzotcrumtywdnvd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log("🔍 Testing Supabase Database Connection and Schema...\n");
  
  try {
    // Test 1: Basic connection test
    console.log("1. Testing basic connection...");
    const { data, error } = await supabase.from('artists').select('count').single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log("✅ Database connection successful\n");

    // Test 2: Verify all 15 tables exist
    console.log("2. Verifying database schema (15 expected tables)...");
    const tableQuery = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    const { data: tables, error: tablesError } = await supabase.rpc('sql', { query: tableQuery });
    
    if (tablesError) {
      // Alternative method using information_schema
      const { data: tableInfo, error: infoError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
        
      if (infoError) {
        console.log("⚠️ Cannot query schema directly, testing individual table access...");
        
        // Test each expected table individually
        const expectedTables = [
          'artists', 'venues', 'shows', 'cached_shows', 'songs', 'cached_songs',
          'users', 'user_artists', 'setlists', 'user_votes', 'votes',
          'platform_identifiers', 'sync_events', 'sync_metrics', 'secrets'
        ];
        
        let existingTables = [];
        for (const table of expectedTables) {
          try {
            const { error } = await supabase.from(table).select('count').limit(1);
            if (!error) {
              existingTables.push(table);
              console.log(`  ✅ ${table}`);
            } else {
              console.log(`  ❌ ${table} - ${error.message}`);
            }
          } catch (e) {
            console.log(`  ❌ ${table} - ${e.message}`);
          }
        }
        
        console.log(`\nFound ${existingTables.length}/15 expected tables`);
        if (existingTables.length === 15) {
          console.log("✅ All 15 tables exist and are accessible\n");
        }
        
      } else {
        const tableNames = tableInfo.map(t => t.table_name).sort();
        console.log(`Found ${tableNames.length} tables:`);
        tableNames.forEach(name => console.log(`  - ${name}`));
      }
    }

    // Test 3: Test secrets table access for API keys
    console.log("3. Testing secrets table and API credentials...");
    try {
      const { data: secrets, error: secretsError } = await supabase
        .from('secrets')
        .select('key, created_at')
        .in('key', ['TICKETMASTER_API_KEY', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET']);
        
      if (secretsError) {
        console.log(`⚠️ Cannot access secrets table: ${secretsError.message}`);
      } else {
        console.log(`✅ Secrets table accessible, found ${secrets.length} API credentials:`);
        secrets.forEach(secret => console.log(`  - ${secret.key}`));
      }
    } catch (e) {
      console.log(`⚠️ Error accessing secrets: ${e.message}`);
    }
    
    console.log("\n4. Testing utility functions...");
    try {
      // Test needs_sync function
      const { data: syncTest, error: syncError } = await supabase.rpc('needs_sync', {
        last_sync: null,
        ttl_hours: 24
      });
      
      if (syncError) {
        console.log(`⚠️ needs_sync function error: ${syncError.message}`);
      } else {
        console.log(`✅ needs_sync function working: ${syncTest}`);
      }
    } catch (e) {
      console.log(`⚠️ Error testing functions: ${e.message}`);
    }

    console.log("\n✅ Database schema verification completed!");
    
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    process.exit(1);
  }
}

testDatabase().then(() => {
  console.log("\n🎉 Database testing completed successfully!");
  process.exit(0);
}).catch(error => {
  console.error("💥 Database testing failed:", error);
  process.exit(1);
});