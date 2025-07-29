-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule popular tours sync to run every 6 hours
SELECT cron.schedule(
  'sync-popular-tours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.K5G0lBtpO9kgn8FN8qUBB8PFKTsgtmH_jUw7RDNm7mQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Schedule artist songs sync to run daily
SELECT cron.schedule(
  'sync-artist-songs',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-artist-songs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.K5G0lBtpO9kgn8FN8qUBB8PFKTsgtmH_jUw7RDNm7mQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);