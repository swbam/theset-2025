
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

  // Parse capacity safely
  const capacity = venue.capacity ? parseInt(venue.capacity) : 0;
  
  // If venue has large keywords or significant capacity, consider it large
  return hasLargeKeyword || capacity > 5000;
}

