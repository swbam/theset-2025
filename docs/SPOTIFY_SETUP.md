# Spotify Integration Setup

This guide explains how to set up the Spotify integration for TheSet app.

## Prerequisites

1. Spotify Developer Account
2. Supabase project with Edge Functions enabled

## Setup Steps

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in the app details:
   - App name: TheSet
   - App description: Concert voting app
   - Redirect URI: `https://theset.live/auth/callback`
4. Save your Client ID and Client Secret

### 2. Configure Supabase Edge Functions

The Spotify credentials need to be set as environment variables in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to Settings > Edge Functions
3. Add the following environment variables:
   - `SPOTIFY_CLIENT_ID`: Your Spotify app's Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify app's Client Secret

### 3. Deploy Edge Functions

Deploy the Spotify Edge Function:

```bash
supabase functions deploy spotify
```

Deploy the sync functions:

```bash
supabase functions deploy sync-artist-songs
supabase functions deploy sync-popular-tours
```

### 4. Set Up Cron Jobs (Optional)

To automatically sync artist songs and popular tours, you can set up cron jobs in Supabase:

1. Go to Database > Extensions
2. Enable the `pg_cron` extension
3. Create cron jobs:

```sql
-- Sync artist songs every 3 days
SELECT cron.schedule(
  'sync-artist-songs',
  '0 2 */3 * *', -- Run at 2 AM every 3 days
  $$
  SELECT net.http_post(
    url := 'https://yjnjlaatvbjglzvlbdre.supabase.co/functions/v1/sync-artist-songs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Sync popular tours daily
SELECT cron.schedule(
  'sync-popular-tours',
  '0 1 * * *', -- Run at 1 AM daily
  $$
  SELECT net.http_post(
    url := 'https://yjnjlaatvbjglzvlbdre.supabase.co/functions/v1/sync-popular-tours',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

## Testing

1. Visit a show page in the app
2. The initial setlist should automatically populate with the artist's top 10 tracks from Spotify
3. Users can suggest additional songs using the "Suggest a Song" button
4. All data is cached in the database to minimize API calls

## Troubleshooting

### CORS Errors
- Make sure you're using the Edge Function approach for all Spotify API calls
- Client-side direct API calls will fail due to CORS

### Missing Credentials
- Check that environment variables are properly set in Supabase
- Verify the Edge Function logs for any credential errors

### Rate Limiting
- The Edge Functions include rate limiting and retry logic
- If you hit rate limits, the functions will automatically retry with exponential backoff