-- Ensure we have a proper secrets table for API keys
CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on secrets table
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Create a policy for the service role only (for edge functions)
CREATE POLICY "Service role can access secrets" ON public.secrets
FOR ALL USING (auth.role() = 'service_role');

-- Insert the Ticketmaster API key if it doesn't exist
INSERT INTO public.secrets (key, value)
VALUES ('TICKETMASTER_API_KEY', 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert Spotify credentials
INSERT INTO public.secrets (key, value)
VALUES 
  ('SPOTIFY_CLIENT_ID', '2946864dc822469b9c672292ead45f43'),
  ('SPOTIFY_CLIENT_SECRET', 'feaf0fc901124b839b11e02f97d18a8d')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;