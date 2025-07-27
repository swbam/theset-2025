#!/bin/bash

# Complete TheSet deployment script
# This script helps complete the remaining deployment steps

echo "==================================="
echo "TheSet Deployment Completion Script"
echo "==================================="
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN is not set!"
    echo ""
    echo "To complete deployment, you need to:"
    echo "1. Get your access token from: https://supabase.com/dashboard/account/tokens"
    echo "2. Run: export SUPABASE_ACCESS_TOKEN=your-token-here"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Access token found, proceeding with deployment..."
echo ""

# Deploy Edge Functions
echo "Deploying Edge Functions..."
echo "------------------------"

echo "1. Deploying ticketmaster function..."
npx supabase functions deploy ticketmaster
if [ $? -eq 0 ]; then
    echo "✅ ticketmaster function deployed"
else
    echo "❌ Failed to deploy ticketmaster function"
fi

echo ""
echo "2. Deploying spotify function..."
npx supabase functions deploy spotify
if [ $? -eq 0 ]; then
    echo "✅ spotify function deployed"
else
    echo "❌ Failed to deploy spotify function"
fi

echo ""
echo "3. Deploying sync-artist-songs function..."
npx supabase functions deploy sync-artist-songs
if [ $? -eq 0 ]; then
    echo "✅ sync-artist-songs function deployed"
else
    echo "❌ Failed to deploy sync-artist-songs function"
fi

echo ""
echo "4. Deploying sync-popular-tours function..."
npx supabase functions deploy sync-popular-tours
if [ $? -eq 0 ]; then
    echo "✅ sync-popular-tours function deployed"
else
    echo "❌ Failed to deploy sync-popular-tours function"
fi

echo ""
echo "==================================="
echo "Deployment Summary"
echo "==================================="
echo ""
echo "✅ Database setup complete"
echo "✅ Secrets configured"
echo "✅ Edge Functions deployed (if no errors above)"
echo ""
echo "Remaining manual steps:"
echo "1. Configure Spotify OAuth at:"
echo "   https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/auth/providers"
echo ""
echo "2. Get your anon key from:"
echo "   https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/settings/api"
echo ""
echo "3. Create .env.local with:"
echo "   VITE_SUPABASE_URL=https://nxeokwzotcrumtywdnvd.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "4. Test the deployment with the provided test commands in DEPLOYMENT_STATUS.md"