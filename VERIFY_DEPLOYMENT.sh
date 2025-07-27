#!/bin/bash

# Verification script for TheSet deployment
# Project: nxeokwzotcrumtywdnvd

echo "🔍 VERIFYING THESET DEPLOYMENT..."
echo ""
echo "Project ID: nxeokwzotcrumtywdnvd"
echo "URL: https://nxeokwzotcrumtywdnvd.supabase.co"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local data=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

echo "1. Testing Edge Functions..."
echo "----------------------------"

# Test Ticketmaster
test_endpoint "Ticketmaster Health" \
    "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster" \
    '{"endpoint":"health"}'

# Test Spotify
test_endpoint "Spotify Search" \
    "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/spotify" \
    '{"action":"searchArtist","params":{"artistName":"Taylor Swift"}}'

# Test sync functions
test_endpoint "Sync Popular Tours" \
    "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours" \
    '{}'

test_endpoint "Sync Artist Songs" \
    "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs" \
    '{}'

echo ""
echo "2. Checking Database..."
echo "----------------------"

# Check if we can query the database
echo -n "Testing database connection... "
db_test=$(curl -s "https://nxeokwzotcrumtywdnvd.supabase.co/rest/v1/secrets?select=key" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY:-test}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY:-test}" 2>/dev/null)

if [[ "$db_test" == *"key"* ]] || [[ "$db_test" == *"JWT"* ]]; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${YELLOW}⚠️  Need anon key${NC}"
fi

echo ""
echo "3. Deployment Checklist..."
echo "-------------------------"

# Check local files
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2"
    fi
}

check_file "setup-credentials.sql" "Database credentials SQL"
check_file "setup-database-functions.sql" "Database functions SQL"
check_file "supabase/functions/ticketmaster/index.ts" "Ticketmaster function"
check_file "supabase/functions/spotify/index.ts" "Spotify function"
check_file "supabase/functions/sync-artist-songs/index.ts" "Sync artist songs function"
check_file "supabase/functions/sync-popular-tours/index.ts" "Sync popular tours function"
check_file ".env.local" "Local environment file"

echo ""
echo "4. Next Steps..."
echo "----------------"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}1. Create .env.local:${NC}"
    echo "   VITE_SUPABASE_URL=https://nxeokwzotcrumtywdnvd.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY=<get from dashboard>"
    echo ""
fi

echo -e "${YELLOW}2. Configure Spotify OAuth:${NC}"
echo "   https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/auth/providers"
echo "   - Enable Spotify"
echo "   - Client ID: 2946864dc822469b9c672292ead45f43"
echo "   - Client Secret: feaf0fc901124b839b11e02f97d18a8d"
echo ""

echo -e "${YELLOW}3. Deploy Edge Functions (if not deployed):${NC}"
echo "   https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/functions"
echo ""

echo "🏁 Verification complete!"