# TheSet App - Manual Testing Plan

## Prerequisites
1. Edge Functions deployed (`./FIX_AND_TEST_APP.sh`)
2. App running locally (`npm run dev`)
3. Supabase Spotify OAuth configured

## Test Cases

### 1. Homepage - Search Functionality ✅
- [ ] Homepage loads with search bar
- [ ] Search for "Taylor Swift" shows autocomplete results
- [ ] Search for "Coldplay" shows autocomplete results
- [ ] Clicking on artist navigates to artist page
- [ ] Empty search shows no results message
- [ ] Featured artists section shows data
- [ ] Trending shows section shows data

### 2. Artist Page ✅
- [ ] Navigate to `/artist/Taylor Swift`
- [ ] Artist image and name display correctly
- [ ] Shows list loads for the artist
- [ ] First visit triggers auto-sync (check network tab)
- [ ] Shows are clickable and navigate to show page
- [ ] Related artists section displays (if available)

### 3. Show Page - Core Voting ✅
- [ ] Navigate to a show from artist page
- [ ] Show details display (venue, date, time)
- [ ] Initial setlist populates with top 10 tracks
- [ ] Vote buttons are clickable
- [ ] Guest users can vote once, then see "Sign in Required"
- [ ] Vote counts display correctly
- [ ] Songs are sorted by vote count

### 4. Authentication Flow ✅
- [ ] Click "Sign in with Spotify" button
- [ ] Redirects to Spotify OAuth
- [ ] After login, redirects back to app
- [ ] User profile shows in navigation
- [ ] Authenticated users can vote multiple times (one per song)

### 5. Real-time Voting Updates ✅
- [ ] Open same show page in two browser tabs
- [ ] Vote in one tab
- [ ] Vote count updates in other tab without refresh
- [ ] Add song suggestion in one tab
- [ ] New song appears in other tab

### 6. Song Suggestion ✅
- [ ] Click "Suggest a song" button
- [ ] Search for songs shows results
- [ ] Can add song to setlist
- [ ] New song appears with "Fan suggestion" badge
- [ ] Others can vote on suggested songs

### 7. Mobile Experience ✅
- [ ] Open app in mobile viewport
- [ ] Bottom navigation bar appears
- [ ] Swipe left/right navigates between pages
- [ ] All interactive elements are touch-friendly
- [ ] Voting works on mobile

### 8. Error Handling ✅
- [ ] Search for non-existent artist
- [ ] Navigate to invalid show ID
- [ ] Try to vote twice on same song (should show error)
- [ ] Network errors show appropriate messages

### 9. Performance ✅
- [ ] Pages load quickly
- [ ] Search has debouncing
- [ ] Images load properly
- [ ] No console errors in browser

### 10. Data Persistence ✅
- [ ] Votes persist after page refresh
- [ ] User votes tracked correctly
- [ ] Setlists remain consistent
- [ ] Artist/show data cached properly

## Known Issues to Fix

1. **ShowPage Bug**: Fixed - setlist song IDs now correctly retrieved
2. **Edge Functions**: Need deployment with access token
3. **Database Empty**: Need initial data sync
4. **Spotify OAuth**: Need configuration in Supabase dashboard

## Testing Flow

1. Start with homepage search
2. Navigate through artist → show → voting
3. Test as guest user first
4. Sign in and test authenticated features
5. Test real-time updates with multiple tabs
6. Test mobile experience
7. Verify all error cases

## Success Criteria

- All core features work without errors
- Real-time updates function correctly
- Mobile experience is smooth
- No critical bugs or crashes
- Performance is acceptable
- Error messages are user-friendly