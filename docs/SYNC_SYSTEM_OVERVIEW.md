# TheSet Sync System Overview

## Architecture

TheSet uses a multi-layered sync system to efficiently manage data from Ticketmaster and Spotify:

```
Ticketmaster API → sync-popular-tours → Database (artists, venues, shows)
                                              ↓
                                     sync-artist-songs
                                              ↓
                                      Spotify API → cached_songs
                                              ↓
                                        ShowPage → Setlist Creation
```

## Data Flow

### 1. Popular Tours Sync (Daily)
- Fetches upcoming concerts from Ticketmaster
- Creates/updates records in:
  - `artists` table (with Ticketmaster ID)
  - `venues` table
  - `cached_shows` table

### 2. Artist Songs Sync (Every 3 Days)
- Processes artists that need Spotify data
- For each artist with a `spotify_id`:
  - Fetches top tracks and recent albums from Spotify
  - Stores up to 50 songs per artist in `cached_songs`
  - Updates `last_synced_at` timestamp

### 3. Setlist Creation (On-Demand)
When a user visits a show page:

1. **Check Existing Setlist**: Query `setlists` table for the show
2. **If No Setlist Exists**:
   - Get artist's Spotify ID (search if needed)
   - Fetch top 10 tracks using Spotify Edge Function
   - Create initial setlist with 0 votes
3. **Display Setlist**: Show songs with real-time vote counts

### 4. Song Suggestions
Users can suggest additional songs:
- Search Spotify catalog via Edge Function
- Add suggested songs to setlist
- Mark as `suggested: true`

## Edge Functions

### `/spotify`
Server-side Spotify API calls to avoid CORS issues:
- `searchArtist`: Find artist by name
- `getArtistTopTracks`: Get top 10 tracks
- `searchTracks`: Search for songs to suggest

### `/sync-artist-songs`
Batch sync artist catalogs from Spotify:
- Rate-limited with retry logic
- Processes up to 200 artists per run
- Caches songs for 3 days

### `/sync-popular-tours`
Sync upcoming shows from Ticketmaster:
- Filters by popularity threshold
- Creates artist/venue/show records
- Runs daily via cron

### `/ticketmaster`
Proxy for Ticketmaster API calls:
- Handles authentication
- Provides consistent error handling

## Database Schema

### Core Tables
- `artists`: Artist profiles with Spotify/Ticketmaster IDs
- `venues`: Concert venue information
- `cached_shows`: Upcoming shows from Ticketmaster
- `cached_songs`: Artist songs from Spotify
- `setlists`: Show-specific setlists with voting data
- `user_votes`: Individual user votes

### Key Relationships
- Shows → Artists (via artist_id)
- Shows → Venues (via venue_id)
- Songs → Artists (via artist_id)
- Setlists → Shows (via show_id)
- Votes → Users & Songs

## Caching Strategy

1. **Artist Data**: Refreshed when Ticketmaster data updates
2. **Song Catalog**: Cached for 3 days per artist
3. **Show Data**: Updated daily from Ticketmaster
4. **Setlists**: Created on first visit, persisted forever

## Performance Optimizations

1. **Batch Processing**: Process multiple records in parallel
2. **Rate Limiting**: Respect API limits with exponential backoff
3. **Caching**: Minimize API calls by storing data locally
4. **Lazy Loading**: Only sync data when needed
5. **Circuit Breakers**: Prevent cascade failures

## Error Handling

- Retry failed API calls with exponential backoff
- Log errors to `sync_events` table
- Graceful degradation when APIs unavailable
- Transaction rollback on partial failures