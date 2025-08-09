import { TopNavigation } from '@/components/layout/TopNavigation';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters, type SearchFilters as SearchFiltersType } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchArtists } from '@/integrations/ticketmaster/artists';
import { fetchPopularTours } from '@/integrations/ticketmaster/artists';
import { useToast } from '@/hooks/use-toast';
import { toSlug, createShowSlug } from '@/utils/slug';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Search for artists
      const artistResults = await searchArtists(searchQuery);
      setArtists(artistResults || []);

      // Search for shows (using popular tours and filtering by query)
      const showResults = await fetchPopularTours();
      const filteredShows = (showResults || []).filter(show => 
        show.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show._embedded?.attractions?.[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setShows(filteredShows);

      // Extract venues from shows
      const venueResults = (showResults || [])
        .filter(show => show._embedded?.venues?.[0])
        .map(show => show._embedded.venues[0])
        .filter(venue => venue.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Deduplicate venues
      const uniqueVenues = venueResults.filter((venue, index, self) => 
        index === self.findIndex(v => v.id === venue.id)
      );
      setVenues(uniqueVenues);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtistClick = (artistName: string) => {
    navigate(`/artist/${toSlug(artistName)}`);
  };

  const handleShowClick = (show: any) => {
    if (show.id) {
      const artistName = show._embedded?.attractions?.[0]?.name || 'artist';
      const venueName = show._embedded?.venues?.[0]?.name || 'venue';
      const city = show._embedded?.venues?.[0]?.city?.name || 'city';
      const state = show._embedded?.venues?.[0]?.state?.name || show._embedded?.venues?.[0]?.state?.stateCode || 'state';
      const showDate = show.dates?.start?.dateTime;
      
      if (showDate) {
        const showSlug = createShowSlug(artistName, venueName, city, state, showDate);
        navigate(`/show/${showSlug}?id=${show.id}`);
      } else {
        const showSlug = toSlug(`${artistName} ${venueName} ${city} ${state}`);
        navigate(`/show/${showSlug}?id=${show.id}`);
      }
    }
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    // Apply filters to results
    // This would typically refetch data with filters applied
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>

        {/* Search Results */}
        <SearchResults
          query={query}
          artists={artists}
          shows={shows}
          venues={venues}
          isLoading={isLoading}
          onShowClick={handleShowClick}
          onArtistClick={handleArtistClick}
        />
      </div>
      <Footer />
    </div>
  );
}