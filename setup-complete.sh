#!/bin/bash

# Complete setup script for TheSet app

echo "🎵 Setting up TheSet Concert Voting App..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# 1. Database Setup
echo "📊 Setting up database..."
echo "Please run these SQL scripts in your Supabase SQL editor:"
echo ""
echo "1. setup-credentials.sql - Adds API keys to secrets table"
echo "2. setup-database-functions.sql - Creates necessary database functions"
echo ""
echo "Press Enter when you've run both SQL scripts..."
read

# 2. Deploy Edge Functions
echo ""
echo "🚀 Deploying Edge Functions..."
cd supabase/functions

echo "Deploying Ticketmaster function..."
supabase functions deploy ticketmaster

echo "Deploying Spotify function..."
supabase functions deploy spotify

echo "Deploying sync-artist-songs function..."
supabase functions deploy sync-artist-songs

echo "Deploying sync-popular-tours function..."
supabase functions deploy sync-popular-tours

cd ../..

# 3. Build Frontend
echo ""
echo "🔨 Building frontend..."
npm run build

# 4. Configuration Checklist
echo ""
echo "✅ MANUAL CONFIGURATION REQUIRED:"
echo ""
echo "1. Supabase Auth Configuration:"
echo "   - Go to Authentication > Settings > Auth Providers"
echo "   - Enable Spotify provider"
echo "   - Client ID: 2946864dc822469b9c672292ead45f43"
echo "   - Client Secret: feaf0fc901124b839b11e02f97d18a8d"
echo "   - Redirect URL: https://theset.live/auth/callback"
echo ""
echo "2. Verify Database Setup:"
echo "   - Check that 'secrets' table has Ticketmaster and Spotify credentials"
echo "   - Ensure all database functions were created successfully"
echo ""
echo "3. Deploy to Netlify:"
echo "   - Connect your GitHub repo to Netlify"
echo "   - Set build command: npm run build"
echo "   - Set publish directory: dist"
echo "   - Add environment variable: VITE_SUPABASE_URL"
echo "   - Add environment variable: VITE_SUPABASE_ANON_KEY"
echo ""

# 5. Test Commands
echo "📝 Test Commands:"
echo ""
echo "Test sync functions:"
echo "curl -X POST \"https://your-project.supabase.co/functions/v1/sync-popular-tours\" \\"
echo "  -H \"Authorization: Bearer YOUR_ANON_KEY\""
echo ""
echo "curl -X POST \"https://your-project.supabase.co/functions/v1/sync-artist-songs\" \\"
echo "  -H \"Authorization: Bearer YOUR_ANON_KEY\""
echo ""

echo "🎉 Setup complete! Follow the manual configuration steps above to finish deployment."