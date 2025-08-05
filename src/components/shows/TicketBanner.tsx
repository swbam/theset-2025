import { Button } from '@/components/ui/button';

interface TicketBannerProps {
  url?: string | null;
}

export function TicketBanner({ url }: TicketBannerProps) {
  if (!url) return null;
  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 flex items-center justify-between text-white">
      <p className="font-medium">Tickets available now!</p>
      <Button asChild variant="secondary" className="text-primary font-semibold">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Buy Tickets →
        </a>
      </Button>
    </div>
  );
}

