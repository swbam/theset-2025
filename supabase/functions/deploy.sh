#!/bin/bash

# Deploy all Edge Functions for TheSet app

echo "Deploying TheSet Edge Functions..."

# Deploy Ticketmaster function
echo "Deploying Ticketmaster function..."
supabase functions deploy ticketmaster

# Deploy Spotify function
echo "Deploying Spotify function..."
supabase functions deploy spotify

# Deploy sync functions
echo "Deploying sync-artist-songs function..."
supabase functions deploy sync-artist-songs

echo "Deploying sync-popular-tours function..."
supabase functions deploy sync-popular-tours

echo "All functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Run setup-credentials.sql to add API keys to the database"
echo "2. Configure Spotify OAuth in Supabase Auth settings"
echo "3. Set environment variables in Supabase for Spotify credentials"
echo "4. Set up cron jobs for automatic syncing (see BACKGROUND_JOBS.md)"