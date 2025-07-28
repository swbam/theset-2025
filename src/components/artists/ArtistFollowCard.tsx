import { Calendar, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ArtistFollowCardProps {
  name: string;
  imageUrl: string | null;
  followingSince: string;
  showCount?: number;
  nextShow?: {
    date: string;
    venue: string;
    location: string;
  };
  onClick?: () => void;
}

export const ArtistFollowCard = ({
  name,
  imageUrl,
  followingSince,
  showCount,
  nextShow,
  onClick,
}: ArtistFollowCardProps) => (
  <Card
    className="hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden"
    onClick={onClick}
  >
    {imageUrl && (
      <div
        className="w-full h-32 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
    )}
    <div className="p-6 flex flex-row items-center gap-4">
      <div
        className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0 border border-border"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundColor: !imageUrl ? 'rgba(255,255,255,0.1)' : undefined,
        }}
      />
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {showCount !== undefined
            ? `${showCount} upcoming ${showCount === 1 ? 'show' : 'shows'}`
            : `Following since ${new Date(followingSince).toLocaleDateString()}`}
        </p>
      </div>
    </div>
    {nextShow && (
      <div className="px-6 pb-6 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(nextShow.date).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2" />
          {nextShow.venue}
          {nextShow.location && `, ${nextShow.location}`}
        </div>
      </div>
    )}
  </Card>
);
