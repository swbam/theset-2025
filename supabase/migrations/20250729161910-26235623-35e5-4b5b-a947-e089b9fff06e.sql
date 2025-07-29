-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule sync-popular-tours to run every 6 hours
SELECT cron.schedule(
  'sync-popular-tours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.QLKpz-0HPKEpzJ_jI9hGfq9VE5s5Ym7sVd3xPv5EKnw"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Schedule sync-artist-songs to run daily at 2 AM
SELECT cron.schedule(
  'sync-artist-songs-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.QLKpz-0HPKEpzJ_jI9hGfq9VE5s5Ym7sVd3xPv5EKnw"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);