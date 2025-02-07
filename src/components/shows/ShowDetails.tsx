
interface ShowDetailsProps {
  name: string;
  date: string;
  venue?: {
    name: string;
    city?: string;
    state?: string;
  };
}

export const ShowDetails = ({ name, date, venue }: ShowDetailsProps) => (
  <div>
    <h1 className="text-4xl font-bold text-white mb-4">{name}</h1>
    <div className="space-y-2 text-white/60">
      {venue && (
        <>
          <p>{venue.name}</p>
          {venue.city && venue.state && (
            <p>{venue.city}, {venue.state}</p>
          )}
        </>
      )}
      <p>{new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}</p>
    </div>
  </div>
);
