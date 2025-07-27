# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TheSet** is a concert setlist voting web app that allows users to influence artist setlists for upcoming shows by voting on songs. Built with React, Vite, TypeScript, Tailwind CSS, and Supabase, it integrates with Ticketmaster API for concert data and Spotify API for artist songs.

## Key Commands

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run build:dev  # Build with development mode
npm run preview    # Preview production build
npm run lint       # Run ESLint checks
```

### Testing & Deployment
```bash
# Deploy Supabase Edge Functions
supabase functions deploy sync-popular-tours
supabase functions deploy sync-artist-songs
supabase functions deploy ticketmaster

# Test Edge Functions manually
curl -X POST "https://your-project.supabase.co/functions/v1/sync-popular-tours" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Architecture & Structure

### Core Application Flow
1. **Search/Discovery**: Users search for artists/shows via Ticketmaster API
2. **Artist Pages**: Display artist info, upcoming shows from cached data
3. **Show Pages**: Dynamic setlist voting interface
4. **Setlist Creation**: Auto-populates with artist's Spotify top 10 tracks on first view
5. **Voting System**: One vote per user per song with real-time updates

### Key Directories
- `/src/pages/`: Main page components (Dashboard, ArtistPage, ShowPage)
- `/src/integrations/`: API clients and integration logic
  - `ticketmaster/`: Event search, artist/venue data
  - `spotify/`: Artist songs, top tracks, user data
  - `supabase/`: Database client and types
- `/src/components/`: Reusable UI components
- `/supabase/functions/`: Edge functions for background sync

### Database Schema (Supabase)
Key tables:
- `artists`: Artist profiles with Ticketmaster/Spotify IDs
- `shows`: Concert events linked to artists/venues
- `venues`: Venue information
- `setlists`: JSON array of songs for each show
- `cached_songs`: Spotify song data cache
- `votes`: User voting records
- `users`: User profiles with Spotify integration
- `secrets`: API credentials storage

### API Integration Pattern
1. **First-time data**: Fetches from external API and caches in DB
2. **Subsequent requests**: Serves from cache with TTL-based refresh
3. **Background sync**: Edge functions update data periodically

## Critical Implementation Details

### Ticketmaster Integration
- API Key stored in `secrets` table (run `setup-credentials.sql`)
- Rate limiting: Built-in delays in sync functions
- Uses `platform_identifiers` for ID mapping between systems

### Spotify Integration
- OAuth via Supabase Auth (configure in dashboard)
- Client credentials in `secrets` table
- Access token required for API calls
- Top tracks endpoint for initial setlist population

### Voting System
- Enforces one vote per user per song
- Real-time vote count updates via React Query invalidation
- `user_votes` table tracks individual votes
- Vote counts calculated dynamically from DB

### Edge Functions
- `sync-popular-tours`: Caches trending concerts (run every 6 hours)
- `sync-artist-songs`: Updates artist song libraries (run daily)
- Require service role key for execution

## Complete Setup Instructions

### 1. Database Setup
```bash
# Run in Supabase SQL editor:
# 1. setup-credentials.sql - Adds API keys (already has actual keys)
# 2. setup-database-functions.sql - Creates necessary functions
```

### 2. Deploy Edge Functions
```bash
./setup-complete.sh
# Or manually:
supabase functions deploy ticketmaster
supabase functions deploy spotify
supabase functions deploy sync-artist-songs
supabase functions deploy sync-popular-tours
```

### 3. Configure Supabase Auth
In Supabase Dashboard > Authentication > Settings > Auth Providers > Spotify:
- **Client ID**: `2946864dc822469b9c672292ead45f43`
- **Client Secret**: `feaf0fc901124b839b11e02f97d18a8d`
- **Redirect URL**: `https://theset.live/auth/callback`

### 4. Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.

## System Status

### ✅ Completed Features
- **Spotify Edge Function**: Server-side API calls with app credentials
- **Real Data Only**: No mock data anywhere - all setlists use real Spotify tracks
- **Song Suggestions**: Full Spotify search and add functionality
- **Voting System**: One vote per user per song with real-time updates
- **Background Sync**: Ready for cron job deployment
- **Database Functions**: All required functions created

### Authentication
- **Setup**: Spotify OAuth must be configured in Supabase Auth settings
- **Flow**: User → Spotify Login → Supabase Auth → Access Token → API Calls

## Development Workflow

1. **Local Development**:
   - Ensure Supabase project is linked
   - Run `npm run dev` for hot reload
   - Use Supabase local emulator for testing

2. **Adding Features**:
   - Check existing patterns in similar components
   - Use TypeScript types from `/src/types/`
   - Follow React Query patterns for data fetching
   - Use Tailwind/shadcn-ui for consistent styling

3. **API Changes**:
   - Update types in `supabase/types.ts` after schema changes
   - Test Edge Functions locally before deployment
   - Monitor rate limits and API quotas

4. **Deployment**:
   - Build with `npm run build`
   - Deploy to Netlify (configured in `netlify.toml`)
   - Deploy Edge Functions separately to Supabase

## Key Patterns

### Data Fetching
```typescript
// Use React Query with Supabase
const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id);
    if (error) throw error;
    return data;
  }
});
```

### Voting Implementation
```typescript
// Check for existing vote before allowing new vote
const { data: existingVote } = await supabase
  .from('votes')
  .select('id')
  .eq('user_id', userId)
  .eq('song_id', songId)
  .maybeSingle();

if (existingVote) {
  throw new Error('Already voted');
}
```

### Error Handling
- API errors: Display toast notifications
- Auth errors: Redirect to login
- Data errors: Show empty states with retry options

## Important Notes

- **Security**: Never commit API keys - use `secrets` table
- **Performance**: Leverage caching to minimize API calls
- **Real-time**: Consider Supabase Realtime for live vote updates
- **Mobile**: Ensure touch gestures and responsive design
- **State Management**: Use React Context for auth, React Query for server state