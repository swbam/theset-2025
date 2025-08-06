interface MapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  venueName?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function MapEmbed({ latitude, longitude, venueName }: MapEmbedProps) {
  if (latitude == null || longitude == null || !MAPBOX_TOKEN) return null;

  const src = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s-music+285A98(${longitude},${latitude})/${longitude},${latitude},13,0/600x300@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <img src={src} alt={`Map of ${venueName}`} className="w-full h-auto" />
    </div>
  );
}

