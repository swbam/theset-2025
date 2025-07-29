-- Test the sync system with some sample data
-- First, let's see what's in our secrets table
SELECT key FROM secrets WHERE key IN ('TICKETMASTER_API_KEY', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET');