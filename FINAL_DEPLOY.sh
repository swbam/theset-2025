#!/bin/bash

# FINAL DEPLOYMENT SCRIPT FOR THESET
# Project ID: nxeokwzotcrumtywdnvd

echo "🚀 COMPLETING THESET DEPLOYMENT..."
echo ""
echo "Project: nxeokwzotcrumtywdnvd"
echo "URL: https://nxeokwzotcrumtywdnvd.supabase.co"
echo ""

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ Failed: $1"
        exit 1
    fi
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref nxeokwzotcrumtywdnvd
check_status "Project linked"

# Check if access token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo ""
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set!"
    echo ""
    echo "To complete deployment:"
    echo "1. Get your access token from: https://supabase.com/dashboard/account/tokens"
    echo "2. Run: export SUPABASE_ACCESS_TOKEN=your-token-here"
    echo "3. Run this script again: ./FINAL_DEPLOY.sh"
    echo ""
    echo "Alternative: Deploy from Supabase Dashboard"
    echo "Go to: https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/functions"
    exit 1
fi

echo ""
echo "🚀 Deploying Edge Functions..."

# Deploy Ticketmaster function
echo "Deploying Ticketmaster function..."
cd supabase/functions
npx supabase functions deploy ticketmaster --project-ref nxeokwzotcrumtywdnvd
check_status "Ticketmaster function deployed"

# Deploy Spotify function  
echo "Deploying Spotify function..."
npx supabase functions deploy spotify --project-ref nxeokwzotcrumtywdnvd
check_status "Spotify function deployed"

# Deploy sync-artist-songs function
echo "Deploying sync-artist-songs function..."
npx supabase functions deploy sync-artist-songs --project-ref nxeokwzotcrumtywdnvd
check_status "Sync artist songs function deployed"

# Deploy sync-popular-tours function
echo "Deploying sync-popular-tours function..."
npx supabase functions deploy sync-popular-tours --project-ref nxeokwzotcrumtywdnvd
check_status "Sync popular tours function deployed"

cd ../..

echo ""
echo "🧪 Testing deployments..."

# Test Ticketmaster
echo "Testing Ticketmaster API..."
curl -s "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"health"}' | jq . || echo "Test failed"

# Test Spotify
echo "Testing Spotify API..."
curl -s "https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/spotify" \
  -H "Content-Type: application/json" \
  -d '{"action":"searchArtist","params":{"artistName":"Taylor Swift"}}' | jq . || echo "Test failed"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 FINAL CHECKLIST:"
echo ""
echo "1. Configure Spotify OAuth:"
echo "   Go to: https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/auth/providers"
echo "   - Enable Spotify"
echo "   - Client ID: 2946864dc822469b9c672292ead45f43"
echo "   - Client Secret: feaf0fc901124b839b11e02f97d18a8d"
echo ""
echo "2. Get your anon key:"
echo "   Go to: https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/settings/api"
echo "   Copy the 'anon public' key"
echo ""
echo "3. Create .env.local:"
echo "   VITE_SUPABASE_URL=https://nxeokwzotcrumtywdnvd.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "4. Deploy to Netlify:"
echo "   - Connect GitHub repo"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist"
echo "   - Add environment variables from .env.local"
echo ""
echo "🎉 TheSet is ready for production!"