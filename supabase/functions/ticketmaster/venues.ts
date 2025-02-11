
export function isLargeVenue(venue: any): boolean {
  if (!venue) return false;

  // Check venue name against keywords safely
  const venueName = (venue.name || '').toLowerCase();
  const hasLargeKeyword = [
    'arena',
    'stadium',
    'amphitheatre',
    'center',
    'theatre',
    'park',
    'hall',
    'coliseum',
    'bowl',
    'pavilion'
  ].some(keyword => venueName.includes(keyword));

  // Parse capacity safely
  let capacity = 0;
  try {
    capacity = venue.capacity ? parseInt(venue.capacity) : 0;
  } catch (error) {
    console.error('Error parsing venue capacity:', error);
  }
  
  // If venue has large keywords or significant capacity, consider it large
  return hasLargeKeyword || capacity > 5000;
}
