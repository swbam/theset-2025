import { useState, useEffect } from 'react';
import { fetchPopularTours } from '@/integrations/ticketmaster/artists';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, MapPin, Calendar, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Show {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: { name: string };
      state?: { name: string };
    }>;
    attractions?: Array<{
      name: string;
      id: string;
    }>;
  };
  info?: string;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
}

interface PopularToursProps {
  onArtistClick?: (artistName: string) => void;
  shows?: Show[];
  isLoading?: boolean;
}

export const PopularTours = ({ onArtistClick, shows = [], isLoading = false }: PopularToursProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleShowClick = (show: Show) => {
    const artist = show._embedded?.attractions?.[0];
    if (artist?.name) {
      if (onArtistClick) {
        onArtistClick(artist.name);
      } else {
        navigate(`/artist/${encodeURIComponent(artist.name)}`);
      }
    }
  };

  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    
    let formatted = date.toLocaleDateString('en-US', options);
    if (timeStr) {
      formatted += ` • ${timeStr}`;
    }
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
            <div className="h-48 bg-gray-800 rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-800 rounded" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Tours Found</h3>
        <p className="text-gray-400">Check back later for the latest popular tours and concerts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <span className="text-sm text-gray-400">Most popular tours right now</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shows.slice(0, 9).map((show) => {
          const venue = show._embedded?.venues?.[0];
          const artist = show._embedded?.attractions?.[0];
          const priceRange = show.priceRanges?.[0];

          return (
            <Card 
              key={show.id} 
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
              onClick={() => handleShowClick(show)}
            >
              {show.images?.[0]?.url && (
                <div 
                  className="h-48 bg-cover bg-center rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url(${show.images[0].url})` }}
                />
              )}
              
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                    {show.name}
                  </h3>
                  
                  {artist && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{artist.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {formatDate(show.dates.start.localDate, show.dates.start.localTime)}
                    </span>
                  </div>
                  
                  {venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 truncate">
                        {venue.name}
                        {venue.city && ` • ${venue.city.name}`}
                        {venue.state && `, ${venue.state.name}`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  {priceRange && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      ${priceRange.min} - ${priceRange.max}
                    </Badge>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600 text-black font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowClick(show);
                    }}
                  >
                    Vote on Setlist
                  </Button>
                </div>
                
                {show.info && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {show.info}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};