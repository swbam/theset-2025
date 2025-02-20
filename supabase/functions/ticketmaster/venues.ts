interface VenueData {
  name?: string;
  capacity?: string;
  city?: {
    name: string;
  };
  state?: {
    name: string;
  };
}

export function isLargeVenue(venue: VenueData): boolean {
  if (!venue) return false;

  // Check venue name against keywords safely
  const venueName = (venue.name || '').toLowerCase();
  const hasLargeKeyword = [
    'arena',
    'stadium',
    'amphitheatre',
    'amphitheater',
    'center',
    'centre',
    'theatre',
    'theater',
    'park',
    'hall',
    'coliseum',
    'bowl',
    'pavilion',
    'auditorium',
    'garden',
    'grounds'
  ].some(keyword => venueName.includes(keyword));

  // Parse capacity safely
  let capacity = 0;
  try {
    capacity = venue.capacity ? parseInt(venue.capacity) : 0;
  } catch (error) {
    console.warn('Error parsing venue capacity:', error);
  }

  // If we have a valid capacity, use it as a criteria
  if (capacity > 0) {
    return capacity >= 2000; // Lower threshold to include more venues
  }

  // If no capacity is provided, rely on venue name keywords
  return hasLargeKeyword;
}

// Helper function to get venue display info
export function getVenueDisplayInfo(venue: VenueData): { name: string; location: string } {
  const name = venue.name || 'Unknown Venue';
  const city = venue.city?.name;
  const state = venue.state?.name;
  
  let location = '';
  if (city && state) {
    location = `${city}, ${state}`;
  } else if (city) {
    location = city;
  } else if (state) {
    location = state;
  }

  return { name, location };
}
