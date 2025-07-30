import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Music, X } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export interface SearchFilters {
  location?: string;
  dateRange?: string;
  genre?: string;
  priceRange?: string;
  sortBy?: string;
}

export const SearchFilters = ({ onFiltersChange, initialFilters = {} }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? 'Less' : 'More'} Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="City, State"
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value || undefined)}
              className="bg-background"
            />
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateRange" className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              When
            </Label>
            <Select value={filters.dateRange || ''} onValueChange={(value) => updateFilter('dateRange', value || undefined)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="next-month">Next month</SelectItem>
                <SelectItem value="this-year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-2">
            <Label htmlFor="sortBy" className="text-sm text-muted-foreground">
              Sort by
            </Label>
            <Select value={filters.sortBy || ''} onValueChange={(value) => updateFilter('sortBy', value || undefined)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter - Only show when expanded */}
          {isExpanded && (
            <div className="space-y-2">
              <Label htmlFor="priceRange" className="text-sm text-muted-foreground">
                Price Range
              </Label>
              <Select value={filters.priceRange || ''} onValueChange={(value) => updateFilter('priceRange', value || undefined)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any price</SelectItem>
                  <SelectItem value="0-50">Under $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-200">$100 - $200</SelectItem>
                  <SelectItem value="200+">$200+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Genre Filter - Only show when expanded */}
        {isExpanded && (
          <div className="mt-4 space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1">
              <Music className="w-3 h-3" />
              Genre
            </Label>
            <div className="flex flex-wrap gap-2">
              {['Rock', 'Pop', 'Hip-Hop', 'Country', 'Electronic', 'Jazz', 'Classical', 'R&B'].map((genre) => (
                <Button
                  key={genre}
                  variant={filters.genre === genre ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('genre', filters.genre === genre ? undefined : genre)}
                  className="text-xs"
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};