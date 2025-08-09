# TheSet: Detailed App Overview

This web app, tentatively titled "TheSet," empowers concertgoers to actively participate in shaping the setlists of their favorite artists' upcoming shows. By integrating with Ticketmaster and Spotify APIs, TheSet provides a seamless platform for users to discover shows, vote on existing songs, and suggest new additions to the setlist, fostering a dynamic and interactive concert experience.

## Full Overview

TheSet is designed to be the go-to platform for concert enthusiasts. Users can effortlessly search for artists and their upcoming shows, all powered by the Ticketmaster API. Upon discovering a show of interest, users are presented with a detailed show page, complete with venue information, date and time, and an interactive setlist section. This setlist section is dynamically populated with the artist's top tracks from Spotify, ensuring an engaging experience from the outset. Users can then vote on their favorite songs, pushing them higher in the setlist ranking, and even suggest new songs from the artist's Spotify catalog. This real-time voting system, coupled with a sleek and intuitive user interface, creates a unique and engaging concert experience, allowing fans to directly influence the music they hear live.

## Core Features & Functionality

### Comprehensive Search

* A prominent search bar on the homepage allows users to instantly search for artists, venues, and shows with an autocomplete/typeahead feature for efficient navigation.
* Search results are ranked based on relevance, popularity, location, and user preferences.

### Dynamic Artist Pages

* Artist pages display a comprehensive overview, including a biography, popular songs, upcoming shows, and related artists.
* Users can follow artists to stay updated on their activities and shows.

### Interactive Show Pages

* Show pages provide detailed information about the venue, date, time, and ticket purchasing options via Ticketmaster affiliate links.
* The core of the show page is the setlist section, featuring:
  * A dynamic list of songs, initially populated with the artist's Spotify top 10 tracks.
  * A Reddit-style upvote system for users to vote on existing songs.
  * A dropdown menu to add new song requests from the artist's Spotify catalog.
  * Real-time updates reflecting vote counts and new song additions.

### Spotify Integration

* Seamless Spotify login for personalized experiences.
* User dashboards display upcoming shows for followed and top listened to artists.
* Artist's Spotify data is used to populate initial setlists and provide song suggestions.

### Robust Voting System

* One vote per user per song is enforced to maintain fairness.
* Error messages are displayed for any attempts to double-vote.
* Real-time updates via WebSockets ensure a dynamic and engaging voting experience.

### Efficient Data Management

* First-time artist and venue clicks trigger data imports to minimize API calls.
* Background jobs handle data synchronization and updates from Spotify and Ticketmaster.
* Caching strategies are implemented at different levels to optimize performance.

## UI Design

### Modern & Intuitive
The UI should be clean, modern, and intuitive, drawing inspiration from popular music platforms like Spotify. Dashboard layout with a left sidebar on desktop and also a top nav bar. On mobile use a bottom mobile nav bar so it feels like a native mobile app. Also on mobile touch gestures similar to the X app to slide out the left nav bar. Use ShadCN for UI components and tailwind CSS. Use a ShadCN example layout for the dashboard. 

### Dark Mode
A dark mode aesthetic is employed to enhance the concert-going experience and reduce eye strain.

### Mobile-First
The design should prioritize a seamless mobile experience, with responsive layouts adapting to various screen sizes.

### Visual Hierarchy
Clear visual hierarchy and typography guide users through the app and highlight essential information.

### Engaging Elements
Interactive elements and animations enhance user engagement and provide feedback.

## Detailed Flow

1. Homepage: User is presented with a search bar, featured artists, and potentially personalized recommendations.
2. Search & Discovery: User searches for an artist, browses through suggestions, and selects an artist page.
3. Artist Exploration: User explores the artist page, views upcoming shows, and potentially follows the artist.
4. Show Selection: User selects a show from the artist page, leading to the dedicated show page where they see the setlist. The initial setlist imports that artist’s top 10 tracks from Spotify api and sets vote count to 0. These 10 songs are stored in my db in that artist profile so it doesnt need to make more api calls each time
5. Setlist Interaction: User interacts with the setlist section, voting on existing songs and adding new requests.
6. Real-time Updates: User experiences dynamic updates to the setlist, reflecting vote counts and new song additions.




### Caching
Implement multi-layered caching (browser, CDN, server-side) to reduce server load and improve response times.

### Database Optimization
Utilize database indexing, query optimization, and potentially read replicas to handle increased traffic and data volumes.
Supabase is already implemented and linked
Sign in with Spotify is already implemented through Supabase auth 
Ticketmaster API key: k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
Spotify credentials needed for importing artist songs to the show pages in the setlist song adder dropdown:
Spotify client ID: 2946864dc822469b9c672292ead45f43
Spotify client secret: feaf0fc901124b839b11e02f97d18a8d
