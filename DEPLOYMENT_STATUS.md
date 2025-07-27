# TheSet App Deployment Status

## Project Details
- **Project ID**: nxeokwzotcrumtywdnvd
- **Project URL**: https://nxeokwzotcrumtywdnvd.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd

## Completed Steps ✅

### 1. Project Linking
```bash
npx supabase link --project-ref nxeokwzotcrumtywdnvd
```
✅ Successfully linked to project

### 2. Database Setup
```bash
npx supabase db push /Users/seth/2025/setup-credentials.sql
npx supabase db push /Users/seth/2025/setup-database-functions.sql
```
✅ Secrets table created
✅ API credentials inserted:
   - Ticketmaster API Key: k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
   - Spotify Client ID: 2946864dc822469b9c672292ead45f43
   - Spotify Client Secret: feaf0fc901124b839b11e02f97d18a8d
✅ Database functions created:
   - cast_vote()
   - check_sync_health()
   - needs_artist_refresh()
   - needs_sync()
   - needs_venue_refresh()
   - update_sync_metrics()
✅ Indexes created for performance

### 3. Edge Function Secrets
```bash
npx supabase secrets set SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43 SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
```
✅ Spotify credentials set as Edge Function secrets

## Remaining Steps ❌

### 4. Deploy Edge Functions
Due to authentication requirements, you need to either:

**Option A: Use Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/functions
2. Deploy each function:
   - `ticketmaster`
   - `spotify`
   - `sync-artist-songs`
   - `sync-popular-tours`

**Option B: Use CLI with Access Token**
1. Get access token from: https://supabase.com/dashboard/account/tokens
2. Run:
```bash
export SUPABASE_ACCESS_TOKEN=your-token-here
npx supabase functions deploy ticketmaster
npx supabase functions deploy spotify
npx supabase functions deploy sync-artist-songs
npx supabase functions deploy sync-popular-tours
```

### 5. Configure Spotify OAuth
1. Go to https://supabase.com/dashboard/project/nxeokwzotcrumtywdnvd/auth/providers
2. Enable Spotify provider
3. Set:
   - Client ID: `2946864dc822469b9c672292ead45f43`
   - Client Secret: `feaf0fc901124b839b11e02f97d18a8d`
   - Redirect URL: `https://nxeokwzotcrumtywdnvd.supabase.co/auth/v1/callback`

### 6. Set Local Environment Variables
Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://nxeokwzotcrumtywdnvd.supabase.co
VITE_SUPABASE_ANON_KEY=[Get from Dashboard > Settings > API]
```

### 7. Test Deployment
Once all functions are deployed, test:
```bash
# Test Ticketmaster integration
curl https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster/search/venues?keyword=madison

# Test Spotify integration  
curl https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/spotify/search?query=taylor+swift
```

## Notes
- All database setup is complete
- Edge Function code is ready to deploy
- Secrets are configured in both database and Edge Function environment
- The project is properly linked but requires authentication for Edge Function deployment