#!/bin/bash

echo "🔧 TheSet App Fix and Test Script"
echo "================================="

# Check if we have the SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set!"
    echo "Please get your access token from: https://supabase.com/dashboard/account/tokens"
    echo "Then run: export SUPABASE_ACCESS_TOKEN=your-token-here"
    exit 1
fi

echo -e "\n1️⃣ Deploying Edge Functions..."

# Deploy all Edge Functions
echo "Deploying ticketmaster function..."
npx supabase functions deploy ticketmaster

echo "Deploying spotify function..."
npx supabase functions deploy spotify

echo "Deploying sync-artist-songs function..."
npx supabase functions deploy sync-artist-songs

echo "Deploying sync-popular-tours function..."
npx supabase functions deploy sync-popular-tours

echo "Deploying auto-sync-artist function..."
npx supabase functions deploy auto-sync-artist

echo -e "\n2️⃣ Running initial data sync..."

SUPABASE_URL="https://nxeokwzotcrumtywdnvd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E"

# Sync popular tours to populate initial data
echo "Syncing popular tours..."
curl -X POST "${SUPABASE_URL}/functions/v1/sync-popular-tours" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 30

echo -e "\n3️⃣ Testing Edge Functions..."

# Test Ticketmaster
echo -e "\n🎫 Testing Ticketmaster Edge Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/ticketmaster" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "search", "query": "Coldplay"}' \
  --max-time 10 \
  -w "\nHTTP Status: %{http_code}\n"

# Test Spotify
echo -e "\n🎵 Testing Spotify Edge Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/spotify" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "searchArtist", "params": {"artistName": "Taylor Swift"}}' \
  --max-time 10 \
  -w "\nHTTP Status: %{http_code}\n"

# Test Auto-Sync Artist
echo -e "\n🔄 Testing Auto-Sync Artist Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/auto-sync-artist" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"artistName": "The Weeknd"}' \
  --max-time 20 \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n4️⃣ Checking Database Tables..."

# Check Artists
echo -e "\n👨‍🎤 Artists in database:"
curl -X GET "${SUPABASE_URL}/rest/v1/artists?select=id,name,spotify_id&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

# Check Shows
echo -e "\n🎭 Shows in database:"
curl -X GET "${SUPABASE_URL}/rest/v1/cached_shows?select=id,name,date,venue_name&limit=5&order=date.asc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

# Check Setlists
echo -e "\n📋 Setlists in database:"
curl -X GET "${SUPABASE_URL}/rest/v1/setlists?select=id,show_id,created_at&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo -e "\n✅ Fix and test complete! Check the results above."
echo -e "\n📝 Next steps:"
echo "1. If functions deployed successfully, the app should now work"
echo "2. Configure Spotify OAuth in Supabase Dashboard"
echo "3. Run 'npm run dev' to test the app locally"
echo "4. Deploy frontend to Netlify when ready"