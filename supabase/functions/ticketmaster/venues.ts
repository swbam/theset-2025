
export function isLargeVenue(venue: any): boolean {
  if (!venue) return false;

  const venueName = (venue.name || '').toLowerCase();
  const hasLargeKeyword = [
    'arena',
    'stadium',
    'amphitheatre',
    'center',
    'theatre',
    'park',
    'hall',
    'coliseum'
  ].some(keyword => venueName.includes(keyword));

  const capacity = venue.capacity ? parseInt(venue.capacity) : 0;
  return hasLargeKeyword || capacity > 5000;
}
