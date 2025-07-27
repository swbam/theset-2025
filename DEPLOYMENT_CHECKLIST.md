# TheSet Deployment Checklist

## Pre-Deployment Steps

### 1. Database Setup
- [ ] Run `setup-credentials.sql` in Supabase SQL editor to add API keys
- [ ] Verify `secrets` table has Ticketmaster and Spotify credentials

### 2. Supabase Auth Configuration
- [ ] Go to Authentication > Settings > Auth Providers
- [ ] Enable Spotify provider
- [ ] Add Spotify Client ID: `2946864dc822469b9c672292ead45f43`
- [ ] Add Spotify Client Secret: `feaf0fc901124b839b11e02f97d18a8d`
- [ ] Set Redirect URL: `https://theset.live/auth/callback`

### 3. Edge Functions Deployment
```bash
cd /Users/seth/2025
./supabase/functions/deploy.sh
```

Or deploy individually:
```bash
supabase functions deploy ticketmaster
supabase functions deploy spotify
supabase functions deploy sync-artist-songs
supabase functions deploy sync-popular-tours
```

### 4. Environment Variables (Supabase Dashboard)
- [ ] Go to Settings > Edge Functions > Secrets
- [ ] Add `SPOTIFY_CLIENT_ID`: `2946864dc822469b9c672292ead45f43`
- [ ] Add `SPOTIFY_CLIENT_SECRET`: `feaf0fc901124b839b11e02f97d18a8d`

### 5. Build and Deploy Frontend
```bash
npm run build
# Deploy to Netlify as configured
```

## Post-Deployment Verification

### 1. Test Core Features
- [ ] Homepage loads with search functionality
- [ ] Can search for artists via Ticketmaster
- [ ] Artist pages show upcoming shows
- [ ] Show pages create setlists with real Spotify tracks
- [ ] Voting system works (one vote per user per song)
- [ ] Song suggestion dialog works with Spotify search

### 2. Test Auth Flow
- [ ] Spotify login works
- [ ] User dashboard shows personalized content
- [ ] Logged-in users can vote

### 3. Test Sync System
- [ ] Manual sync test:
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/sync-popular-tours" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

curl -X POST "https://your-project.supabase.co/functions/v1/sync-artist-songs" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 4. Set Up Cron Jobs (Optional)
Use GitHub Actions, external cron service, or Supabase pg_cron as documented in `BACKGROUND_JOBS.md`

## Critical Checks

### Data Flow Verification
1. **New Show Visit**:
   - Show page loads
   - Checks for existing setlist
   - If none, fetches artist's Spotify top tracks via Edge Function
   - Creates setlist with real songs
   - Stores in database for future visits

2. **No Mock Data**:
   - Verify ShowPage.tsx uses real Spotify data
   - Check that fallback songs are never displayed
   - Ensure all setlists have real track IDs

3. **API Integration**:
   - Ticketmaster Edge Function handles all event searches
   - Spotify Edge Function handles all music data
   - No client-side API calls (avoids CORS issues)

## Monitoring

- Check Supabase Function logs for errors
- Monitor API rate limits
- Track sync job success rates
- Review user voting patterns

## Rollback Plan

If issues occur:
1. Revert to previous deployment
2. Check Edge Function logs for errors
3. Verify API credentials are correct
4. Ensure database migrations completed successfully

## Success Criteria

- [ ] Users can search and view shows
- [ ] Setlists populate with real artist songs
- [ ] Voting system functions correctly
- [ ] Song suggestions work
- [ ] No mock data appears anywhere
- [ ] Background sync jobs run successfully