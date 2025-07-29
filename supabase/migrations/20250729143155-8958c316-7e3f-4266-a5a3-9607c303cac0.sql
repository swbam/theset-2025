-- Enable pg_cron extension for scheduled tasks
SELECT cron.schedule(
  'sync-popular-tours-hourly',
  '0 * * * *', -- every hour
  $$
  select
    net.http_post(
        url:='https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/sync-popular-tours',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.vIg0AK6bQSQu7Y_30DaDOTjN4w_7Uo_Gyl1B_SnvpN8"}'::jsonb,
        body:='{"shows": []}'::jsonb
    ) as request_id;
  $$
);

-- Schedule featured artists sync every 6 hours
SELECT cron.schedule(
  'sync-featured-artists',
  '0 */6 * * *', -- every 6 hours
  $$
  select
    net.http_post(
        url:='https://nxeokwzotcrumtywdnvd.supabase.co/functions/v1/ticketmaster',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZW9rd3pvdGNydW10eXdkbnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2MzI3NywiZXhwIjoyMDY5MTM5Mjc3fQ.vIg0AK6bQSQu7Y_30DaDOTjN4w_7Uo_Gyl1B_SnvpN8"}'::jsonb,
        body:='{"endpoint": "featured"}'::jsonb
    ) as request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;