# TheSet Edge Functions Deployment Guide

## Prerequisites
1. **Supabase Personal Access Token**: You need to obtain a personal access token from your Supabase dashboard at https://app.supabase.com/account/tokens
2. **Supabase CLI**: Already installed (version 2.31.8)

## New Supabase Instance Details
- **Project URL**: https://nxeokwzotcrumtywdnvd.supabase.co
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY
- **Project Reference**: nxeokwzotcrumtywdnvd

## Step 1: Setup CLI Authentication
```bash
# Login with your personal access token
supabase login

# Link to the project
supabase link --project-ref nxeokwzotcrumtywdnvd
```

## Step 2: Configure Environment Variables
Before deploying, ensure these environment variables are set in your Supabase project:

```bash
# Set environment variables for all functions
supabase secrets set SUPABASE_URL=https://nxeokwzotcrumtywdnvd.supabase.co --project-ref nxeokwzotcrumtywdnvd
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY --project-ref nxeokwzotcrumtywdnvd
```

## Step 3: Set up Secrets Table
Run this SQL in your Supabase SQL editor to create the secrets table and add API keys:

```sql
-- Create secrets table
CREATE TABLE IF NOT EXISTS secrets (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert API keys (replace with your actual keys)
INSERT INTO secrets (key, value) VALUES 
  ('TICKETMASTER_API_KEY', 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b'),
  ('SPOTIFY_CLIENT_ID', '2946864dc822469b9c672292ead45f43'),
  ('SPOTIFY_CLIENT_SECRET', 'feaf0fc901124b839b11e02f97d18a8d')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();
```

## Step 4: Deploy Functions

```bash
# Navigate to the project directory
cd /root/repo

# Deploy all functions at once
supabase functions deploy --project-ref nxeokwzotcrumtywdnvd

# Or deploy individually:
supabase functions deploy ticketmaster --project-ref nxeokwzotcrumtywdnvd
supabase functions deploy sync-popular-tours --project-ref nxeokwzotcrumtywdnvd
supabase functions deploy sync-artist-songs --project-ref nxeokwzotcrumtywdnvd
```

## Step 5: Test Functions

### Test Ticketmaster Function
```bash
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "featured", "params": {"size": "5"}}'
```

### Test Sync Functions
```bash
# Test popular tours sync
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY"

# Test artist songs sync
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY"
```

## Step 6: Set up Cron Jobs/Scheduling

### Option 1: Using Supabase Cron Extension (Recommended)
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule popular tours sync every 6 hours
SELECT cron.schedule(
  'sync-popular-tours',
  '0 */6 * * *',
  'SELECT net.http_post(
    url := ''https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours'',
    headers := ''{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY", "Content-Type": "application/json"}''::jsonb,
    body := ''{}''::jsonb
  );'
);

-- Schedule artist songs sync daily at 2 AM
SELECT cron.schedule(
  'sync-artist-songs',
  '0 2 * * *',
  'SELECT net.http_post(
    url := ''https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs'',
    headers := ''{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY", "Content-Type": "application/json"}''::jsonb,
    body := ''{}''::jsonb
  );'
);
```

### Option 2: Using Database Triggers
```sql
-- Create a function that calls the sync functions
CREATE OR REPLACE FUNCTION trigger_sync_jobs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This would be called by triggers based on your business logic
  PERFORM net.http_post(
    url := 'https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.r1jPPKQ727K8jl_3bxV3BOIm7gTRi1THSuOqa28k6tY"}'::jsonb
  );
END;
$$;
```

## Function Endpoints Summary

After deployment, your functions will be available at:

1. **Ticketmaster API**: `https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster`
   - Supports endpoints: search, artist, events, venues, featured
   - Includes rate limiting (5 requests/second)
   - Handles CORS automatically

2. **Popular Tours Sync**: `https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours`
   - Fetches and caches popular tour data
   - Should be scheduled to run every 6 hours

3. **Artist Songs Sync**: `https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs`
   - Syncs artist song data from Spotify
   - Should be scheduled to run daily

## Database Tables Required

Ensure these tables exist in your database:

```sql
-- Artists table
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  ticketmaster_id VARCHAR(255) UNIQUE,
  spotify_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  metadata JSONB,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Venues table  
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  ticketmaster_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cached shows table
CREATE TABLE cached_shows (
  id SERIAL PRIMARY KEY,
  ticketmaster_id VARCHAR(255) UNIQUE,
  artist_id INTEGER REFERENCES artists(id),
  name VARCHAR(255) NOT NULL,
  date TIMESTAMP,
  venue_name VARCHAR(255),
  venue_location JSONB,
  ticket_url TEXT,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cached songs table
CREATE TABLE cached_songs (
  id SERIAL PRIMARY KEY,
  spotify_id VARCHAR(255) UNIQUE,
  artist_id INTEGER REFERENCES artists(id),
  name VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  preview_url TEXT,
  popularity INTEGER,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Verification Checklist

- [ ] Personal access token configured
- [ ] Project linked successfully
- [ ] Environment variables set
- [ ] Secrets table created with API keys
- [ ] All 3 functions deployed successfully
- [ ] Functions respond to test requests
- [ ] Database tables created
- [ ] Cron jobs scheduled
- [ ] Rate limiting working correctly
- [ ] CORS headers configured properly

## Troubleshooting

1. **Authentication errors**: Ensure you're using the correct service role key in function calls
2. **API key errors**: Verify API keys are correctly stored in the secrets table
3. **Rate limiting**: The Ticketmaster function includes built-in rate limiting
4. **CORS issues**: All functions include proper CORS headers
5. **Function logs**: Check function logs in Supabase dashboard for detailed error information