import { ShowCard } from './ShowCard';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

// Use any for flexibility with different show data structures
type Show = any;

interface ShowGridProps {
  shows: Show[];
  isLoading?: boolean;
  onShowClick: (show: Show) => void;
  emptyMessage?: string;
}

export const ShowGrid = ({ 
  shows, 
  isLoading = false, 
  onShowClick, 
  emptyMessage = "No shows found" 
}: ShowGridProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!shows || shows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {shows.map((show) => (
        <ShowCard
          key={show.id}
          show={show}
          onClick={() => onShowClick(show)}
        />
      ))}
    </div>
  );
};