#!/bin/bash

# Comprehensive app testing script
echo "🧪 TheSet App Testing Script"
echo "=========================="

SUPABASE_URL="https://nxeokwzotcrumtywdnvd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E"

echo -e "\n1️⃣ Testing Ticketmaster Edge Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/ticketmaster" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "search", "query": "Taylor Swift"}' \
  --max-time 10 \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n2️⃣ Testing Auto-Sync Artist Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/auto-sync-artist" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"artistName": "Coldplay"}' \
  --max-time 10 \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n3️⃣ Testing Spotify Edge Function..."
curl -X POST "${SUPABASE_URL}/functions/v1/spotify" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "search_artist", "query": "Taylor Swift"}' \
  --max-time 10 \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n4️⃣ Checking Database Tables..."
echo "Artists table:"
curl -X GET "${SUPABASE_URL}/rest/v1/artists?limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n5️⃣ Checking Shows table:"
curl -X GET "${SUPABASE_URL}/rest/v1/cached_shows?limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n6️⃣ Checking Setlists table:"
curl -X GET "${SUPABASE_URL}/rest/v1/setlists?limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n✅ Testing Complete!"