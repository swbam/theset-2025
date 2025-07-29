# URGENT SYNC SYSTEM TEST

## Test Execution Plan

### 1. Fix Ticketmaster Date Format Issue
- ✅ Updated date format to remove milliseconds properly
- ✅ Fixed search result parsing

### 2. Test Individual Components

#### Ticketmaster API Test
```bash
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"health"}'
```

#### Spotify API Test
```bash
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/spotify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E" \
  -H "Content-Type: application/json" \
  -d '{"action":"searchArtist","params":{"artistName":"Taylor Swift"}}'
```

#### Popular Tours Sync Test
```bash
curl -X POST https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjMyNzcsImV4cCI6MjA2OTEzOTI3N30.jobaxAKkYsCZ6mHpoczG5JxEtWDRDyEgvHhP32ARk3E" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Expected Outcomes
- Ticketmaster API should return events data
- Spotify API should return artist data 
- Popular tours sync should import artists, venues, and shows
- Artist songs sync should import song data
- Setlists should be auto-created with 5 random songs

### 4. Database Verification Queries
```sql
-- Check imported artists
SELECT COUNT(*) as artist_count FROM artists;

-- Check imported venues  
SELECT COUNT(*) as venue_count FROM venues;

-- Check imported shows
SELECT COUNT(*) as show_count FROM cached_shows;

-- Check imported songs
SELECT COUNT(*) as song_count FROM cached_songs;

-- Check created setlists
SELECT COUNT(*) as setlist_count FROM setlists;

-- Check setlist songs
SELECT 
  s.id as setlist_id,
  jsonb_array_length(s.songs) as song_count,
  cs.name as show_name,
  a.name as artist_name
FROM setlists s
JOIN cached_shows cs ON s.show_id = cs.id
JOIN artists a ON cs.artist_id = a.id
LIMIT 5;
```

## STATUS: TESTING IN PROGRESS
- [x] API keys verified 
- [x] Date format fixed
- [x] Search parsing fixed
- [ ] Full sync test pending