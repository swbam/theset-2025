# Background Sync Jobs for TheSet App

## 📋 **Available Sync Jobs**

### 1. **Popular Tours Sync** (`sync-popular-tours`)
**Purpose:** Automatically cache trending concerts and popular tours from Ticketmaster
**Endpoint:** `/functions/v1/sync-popular-tours`
**Frequency:** Every 6 hours
**What it does:**
- Fetches featured/popular events from Ticketmaster API
- Caches venues, artists, and shows in the database
- Updates existing records with fresh data

### 2. **Artist Songs Sync** (`sync-artist-songs`)
**Purpose:** Keep artist song libraries up-to-date with Spotify data
**Endpoint:** `/functions/v1/sync-artist-songs`
**Frequency:** Daily
**What it does:**
- Finds artists with Spotify IDs that need song updates
- Fetches top tracks for each artist from Spotify
- Caches songs in the database for faster setlist creation

## 🕐 **Scheduling Options**

### Option 1: External Cron Service
Use services like **cron-job.org** or **EasyCron** to call the endpoints:

```bash
# Popular tours sync (every 6 hours)
curl -X POST "https://your-project.supabase.co/functions/v1/sync-popular-tours" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Artist songs sync (daily at 2 AM)
curl -X POST "https://your-project.supabase.co/functions/v1/sync-artist-songs" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Option 2: GitHub Actions (Recommended)
Create `.github/workflows/sync-jobs.yml`:

```yaml
name: Background Sync Jobs

on:
  schedule:
    # Popular tours every 6 hours
    - cron: '0 */6 * * *'
    # Artist songs daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  sync-popular-tours:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Popular Tours
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/sync-popular-tours" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"

  sync-artist-songs:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *'
    steps:
      - name: Sync Artist Songs
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/sync-artist-songs" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Option 3: Supabase pg_cron (If Available)
If your Supabase project has pg_cron enabled:

```sql
-- Schedule popular tours sync every 6 hours
SELECT cron.schedule('sync-popular-tours', '0 */6 * * *', 
  'SELECT net.http_post(''https://your-project.supabase.co/functions/v1/sync-popular-tours'', ''{}''::jsonb);');

-- Schedule artist songs sync daily at 2 AM
SELECT cron.schedule('sync-artist-songs', '0 2 * * *', 
  'SELECT net.http_post(''https://your-project.supabase.co/functions/v1/sync-artist-songs'', ''{}''::jsonb);');
```

## 🔧 **Manual Testing**

Test the sync jobs manually:

```bash
# Test popular tours sync
curl -X POST "https://your-project.supabase.co/functions/v1/sync-popular-tours" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test artist songs sync  
curl -X POST "https://your-project.supabase.co/functions/v1/sync-artist-songs" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 📊 **Monitoring**

Both functions return detailed responses:

```json
{
  "success": true,
  "message": "Sync completed. Processed: 45, Errors: 2",
  "totalEvents": 47,
  "processedCount": 45,
  "errorCount": 2,
  "timestamp": "2025-01-XX T12:00:00.000Z"
}
```

## ⚠️ **Important Notes**

1. **Rate Limiting:** Functions include built-in delays to respect API rate limits
2. **Error Handling:** Functions continue processing even if individual items fail
3. **Idempotency:** Functions can be run multiple times safely (upsert operations)
4. **Credentials:** Ensure `setup-credentials.sql` has been executed before running
5. **Logs:** Check Supabase function logs for detailed execution information

## 🚀 **Quick Setup**

1. Deploy the Edge Functions to Supabase
2. Run `setup-credentials.sql` to add API credentials
3. Set up your preferred scheduling method
4. Test manually to ensure everything works
5. Monitor execution through Supabase dashboard logs

The background sync jobs ensure your app always has fresh data without manual intervention!