-- Schema for artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema for artist_identifiers table
CREATE TABLE IF NOT EXISTS public.artist_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'ticketmaster')),
  platform_id TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (platform, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_identifiers_artist_platform
ON public.artist_identifiers (artist_id, platform);

-- Schema for cached_songs table
CREATE TABLE IF NOT EXISTS public.cached_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  name TEXT NOT NULL,
  album TEXT,
  popularity INT,
  preview_url TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cached_songs_platform_id
ON public.cached_songs (platform_id);

-- Schema for cached_shows table
CREATE TABLE IF NOT EXISTS public.cached_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists (id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  venue_name TEXT,
  ticket_url TEXT,
  status TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cached_shows_platform_id
ON public.cached_shows (platform_id);

-- Schema for setlists table
CREATE TABLE IF NOT EXISTS public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES public.cached_shows (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema for setlist_songs table
CREATE TABLE IF NOT EXISTS public.setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists (id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  votes INT DEFAULT 0,
  is_top_track BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);