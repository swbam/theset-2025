-- Setup API credentials for TheSet app
-- This script inserts the required API keys into the secrets table

-- Create secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS secrets (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert Ticketmaster API key
INSERT INTO secrets (key, value) 
VALUES ('TICKETMASTER_API_KEY', 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert Spotify credentials for both OAuth and background sync jobs
INSERT INTO secrets (key, value) 
VALUES 
  ('SPOTIFY_CLIENT_ID', '2946864dc822469b9c672292ead45f43'),
  ('SPOTIFY_CLIENT_SECRET', 'feaf0fc901124b839b11e02f97d18a8d')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Note: For Spotify OAuth, these same credentials should also be configured 
-- in the Supabase dashboard under Authentication > Settings > Auth Providers > Spotify

-- Verify the secrets were inserted
SELECT key, 
       CASE 
         WHEN LENGTH(value) > 10 THEN CONCAT(LEFT(value, 10), '...')
         ELSE value 
       END as value_preview,
       created_at 
FROM secrets;